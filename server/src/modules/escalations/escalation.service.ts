/**
 * modules/escalations/escalation.service.ts
 *
 * The escalation rule engine. Called both by the scheduled job
 * (src/jobs/escalationJob.ts) and by the manual "run now" endpoint
 * (POST /setup/escalation-rules/run-now) — same code path either way, so
 * testing via the manual endpoint exercises exactly what the job runs.
 *
 * Deliberately NOT a queue system — this is the first scheduled job in the
 * app, and a straightforward sweep-all-open-requests-against-all-active-rules
 * pass is more than fast enough at this data volume. If that ever stops
 * being true, that's the point to reach for a queue, not before.
 */
import { prisma } from '../../config/database'
import { recordTimelineEvent } from '../../common/utils/timeline'

const OPEN_STATUSES_NOT_IN = ['done', 'cancelled']

function renderTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => vars[key] ?? match)
}

export interface EscalationRunResult {
  requestsChecked: number
  rulesFired: number
}

export async function runEscalationCheck(): Promise<EscalationRunResult> {
  const activeRules = await prisma.escalationRule.findMany({ where: { isActive: true } })
  if (activeRules.length === 0) return { requestsChecked: 0, rulesFired: 0 }

  const openRequests = await prisma.request.findMany({
    where: { status: { notIn: OPEN_STATUSES_NOT_IN }, dueAt: { not: null } },
    include: { dealer: true },
  })

  const now = Date.now()
  let rulesFired = 0

  for (const request of openRequests) {
    if (!request.dueAt) continue
    const effectivePriority = request.priorityOverride ?? request.priority

    for (const rule of activeRules) {
      if (rule.triggerPriority !== null && rule.triggerPriority !== effectivePriority) continue
      if (rule.triggerRequestTypeId !== null && rule.triggerRequestTypeId !== request.typeId) continue

      const breachThreshold = request.dueAt.getTime() + rule.triggerHoursOverdue * 3_600_000
      if (now < breachThreshold) continue

      // Structural anti-double-fire: the unique(ruleId, requestId) constraint
      // is the real guarantee here (catches races between concurrent runs);
      // this existence check just avoids a wasted round-trip on the common case.
      const alreadyFired = await prisma.escalationLog.findUnique({
        where: { ruleId_requestId: { ruleId: rule.id, requestId: request.id } },
      })
      if (alreadyFired) continue

      const hoursOverdue = Math.floor((now - request.dueAt.getTime()) / 3_600_000)
      const message = renderTemplate(rule.escalationMessage, {
        ref_no: request.refNo,
        dealer_name: request.dealer?.name ?? 'Unknown dealer',
        hours_overdue: String(hoursOverdue),
        title: request.title,
      })

      let actionTaken: string
      try {
        actionTaken = await applyAction(rule, request, message)
      } catch {
        // A bad/stale target (e.g. a deactivated staff member) shouldn't
        // crash the whole sweep — log it as a no-op and move on.
        actionTaken = 'Action failed — target may be invalid or inactive'
      }

      try {
        await prisma.escalationLog.create({ data: { ruleId: rule.id, requestId: request.id, actionTaken } })
      } catch {
        // Unique constraint hit — another run already logged this
        // (ruleId, requestId) pair between our check and this write. Skip
        // silently; the other run already recorded it.
        continue
      }

      await recordTimelineEvent({
        entityType: 'request',
        entityId: request.id,
        eventType: 'escalated',
        summary: `Escalation "${rule.name}" fired — ${actionTaken}`,
        actorStaffId: null,
      })

      rulesFired++
    }
  }

  return { requestsChecked: openRequests.length, rulesFired }
}

async function applyAction(
  rule: { id: number; name: string; actionType: string; actionTargetStaffId: number | null; actionTargetRole: string | null },
  request: { id: number },
  message: string,
): Promise<string> {
  if (rule.actionType === 'notify_owner') {
    const current = await prisma.request.findUnique({ where: { id: request.id }, select: { ownerStaffId: true } })
    if (!current?.ownerStaffId) return 'No owner to notify — skipped'
    await prisma.notification.create({
      data: { staffId: current.ownerStaffId, title: rule.name, body: message, message, linkUrl: `/requests/${request.id}`, isRead: false },
    })
    return `Notified owner (staff #${current.ownerStaffId})`
  }

  if (rule.actionType === 'notify_role') {
    const roleKey = rule.actionTargetRole
    if (!roleKey) return 'No target role configured — skipped'
    const staffInRole = await prisma.staff.findMany({
      where: { isActive: true, roles: { some: { role: { key: roleKey } } } },
      select: { id: true },
    })
    if (staffInRole.length === 0) return `No active staff hold role "${roleKey}" — skipped`
    await prisma.notification.createMany({
      data: staffInRole.map((s) => ({ staffId: s.id, title: rule.name, body: message, message, linkUrl: `/requests/${request.id}`, isRead: false })),
    })
    return `Notified role "${roleKey}" (${staffInRole.length} staff)`
  }

  if (rule.actionType === 'reassign') {
    const targetId = rule.actionTargetStaffId
    if (!targetId) return 'No target staff configured — skipped'
    const target = await prisma.staff.findUnique({ where: { id: targetId } })
    if (!target || !target.isActive) return `Target staff #${targetId} is inactive — skipped reassignment`
    await prisma.request.update({ where: { id: request.id }, data: { ownerStaffId: targetId } })
    await prisma.notification.create({
      data: { staffId: targetId, title: rule.name, body: message, message, linkUrl: `/requests/${request.id}`, isRead: false },
    })
    return `Reassigned to ${target.name} (staff #${targetId})`
  }

  return `Unknown action type "${rule.actionType}" — skipped`
}
