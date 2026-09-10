import { Router, Request, Response } from 'express'
import { prisma } from '../../config/database'
import { authenticate } from '../../common/middleware/authenticate'
import { asyncHandler } from '../../common/utils/asyncHandler'
import { ok } from '../../common/utils/response'
import { toVisitDto } from '../visits/visit.mapper'
import { toRequestDto, isOverdue } from '../requests/request.mapper'

const visitInclude = { visitType: true, owner: true, dealer: true, prospect: true } as const
const requestInclude = { type: true, owner: true, dealer: true } as const
const OPEN_STATUSES_NOT_IN = ['done', 'cancelled']

function startOfDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function endOfDay(d = new Date()): Date {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}
function startOfWeek(d = new Date()): Date {
  const x = startOfDay(d)
  const day = x.getDay()
  x.setDate(x.getDate() - (day === 0 ? 6 : day - 1))
  return x
}
function endOfWeek(d = new Date()): Date {
  const x = startOfWeek(d)
  x.setDate(x.getDate() + 6)
  return endOfDay(x)
}

export const dashboardRouter = Router()
dashboardRouter.use(authenticate)

dashboardRouter.get(
  '/my-day',
  asyncHandler(async (req: Request, res: Response) => {
    const visits = await prisma.visit.findMany({
      where: { ownerStaffId: req.staff!.id, scheduledAt: { gte: startOfDay(), lte: endOfDay() } },
      include: visitInclude,
      orderBy: { scheduledAt: 'asc' },
    })
    ok(res, visits.map(toVisitDto))
  }),
)

dashboardRouter.get(
  '/my-week',
  asyncHandler(async (req: Request, res: Response) => {
    const visits = await prisma.visit.findMany({
      where: { ownerStaffId: req.staff!.id, scheduledAt: { gte: startOfWeek(), lte: endOfWeek() } },
      include: visitInclude,
      orderBy: { scheduledAt: 'asc' },
    })
    ok(res, visits.map(toVisitDto))
  }),
)

dashboardRouter.get(
  '/queue',
  asyncHandler(async (_req: Request, res: Response) => {
    const now = new Date()
    const startOfToday = startOfDay()
    const endOfToday = endOfDay()
    const startOfThisWeek = startOfWeek()

    const [openRequests, breached, dueToday, open, waiting, doneThisWeek, staffList] = await Promise.all([
      prisma.request.findMany({ where: { status: { notIn: OPEN_STATUSES_NOT_IN } }, include: requestInclude, orderBy: { priority: 'asc' }, take: 200 }),
      prisma.request.count({ where: { status: { notIn: OPEN_STATUSES_NOT_IN }, dueAt: { lt: now } } }),
      prisma.request.count({ where: { status: { notIn: OPEN_STATUSES_NOT_IN }, dueAt: { gte: startOfToday, lte: endOfToday } } }),
      prisma.request.count({ where: { status: { notIn: OPEN_STATUSES_NOT_IN } } }),
      prisma.request.count({ where: { status: { in: ['waiting_dealer', 'waiting_internal'] } } }),
      prisma.request.count({ where: { status: 'done', doneAt: { gte: startOfThisWeek } } }),
      prisma.staff.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    ])

    const unassigned = openRequests.filter((r) => !r.ownerStaffId).length
    const unscheduled = openRequests.filter((r) => !r.scheduledAt).length
    const incomplete = openRequests.filter((r) => r.completionDone < r.completionRequired).length

    const team = await Promise.all(
      staffList.map(async (s) => {
        const [openCount, overdueCount] = await Promise.all([
          prisma.request.count({ where: { ownerStaffId: s.id, status: { notIn: OPEN_STATUSES_NOT_IN } } }),
          prisma.request.count({ where: { ownerStaffId: s.id, status: { notIn: OPEN_STATUSES_NOT_IN }, dueAt: { lt: now } } }),
        ])
        return { staffid: s.id, name: s.name, open_count: openCount, overdue_count: overdueCount }
      }),
    )

    ok(res, {
      requests: openRequests.map(toRequestDto),
      stats: { breached, due_today: dueToday, open, waiting, done_this_week: doneThisWeek },
      attention: { unassigned, unscheduled, incomplete, breached },
      team,
    })
  }),
)

dashboardRouter.get(
  '/dashboard',
  asyncHandler(async (_req: Request, res: Response) => {
    const now = new Date()
    const startOfToday = startOfDay()
    const endOfToday = endOfDay()

    const activeRequests = await prisma.request.findMany({ where: { status: { notIn: OPEN_STATUSES_NOT_IN } }, include: requestInclude })
    const openCount = activeRequests.length
    const p1p2 = activeRequests.filter((r) => (r.priorityOverride ?? r.priority) <= 2).length
    const breached = activeRequests.filter((r) => isOverdue(r)).length
    const unassigned = activeRequests.filter((r) => !r.ownerStaffId).length

    const [visitsToday, dealers, prospects, visits, team] = await Promise.all([
      prisma.visit.count({ where: { scheduledAt: { gte: startOfToday, lte: endOfToday } } }),
      prisma.dealer.findMany({ select: { id: true, health: true, territoryId: true, territory: { select: { name: true } } } }),
      prisma.prospect.findMany({ select: { stage: true } }),
      prisma.visit.findMany({ select: { status: true } }),
      prisma.staff.findMany({ where: { isActive: true }, select: { id: true, name: true } }),
    ])

    const prospectsFollowup = prospects.filter((p) => ['contacted', 'qualified', 'visit_planned'].includes(p.stage)).length
    const converted = prospects.filter((p) => p.stage === 'converted').length
    const convPct = prospects.length ? Math.round((converted / prospects.length) * 100) : 0

    const trend = await Promise.all(
      Array.from({ length: 7 }, async (_, i) => {
        const day = new Date(now)
        day.setDate(day.getDate() - (6 - i))
        const from = startOfDay(day)
        const to = endOfDay(day)
        const [createdCount, doneCount] = await Promise.all([
          prisma.request.count({ where: { createdAt: { gte: from, lte: to } } }),
          prisma.request.count({ where: { doneAt: { gte: from, lte: to } } }),
        ])
        return { day: day.toLocaleDateString('en-US', { weekday: 'short' }), new: createdCount, done: doneCount }
      }),
    )

    const dealerHealth = dealers.reduce(
      (acc, d) => {
        const key = d.health as 'good' | 'warning' | 'critical'
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      },
      { good: 0, warning: 0, critical: 0 } as Record<'good' | 'warning' | 'critical', number>,
    )

    const territoryMap = new Map<string, { dealers: number; requests: number }>()
    for (const d of dealers) {
      const key = d.territory.name
      const entry = territoryMap.get(key) ?? { dealers: 0, requests: 0 }
      entry.dealers += 1
      territoryMap.set(key, entry)
    }
    for (const r of activeRequests) {
      if (!r.dealerId) continue
      const dealer = dealers.find((d) => d.id === r.dealerId)
      if (!dealer) continue
      const entry = territoryMap.get(dealer.territory.name)
      if (entry) entry.requests += 1
    }

    const teamPerf = await Promise.all(
      team.map(async (s) => {
        const [openCountForStaff, overdueCountForStaff] = await Promise.all([
          prisma.request.count({ where: { ownerStaffId: s.id, status: { notIn: OPEN_STATUSES_NOT_IN } } }),
          prisma.request.count({ where: { ownerStaffId: s.id, status: { notIn: OPEN_STATUSES_NOT_IN }, dueAt: { lt: now } } }),
        ])
        return { staffid: s.id, name: s.name, open_count: openCountForStaff, overdue_count: overdueCountForStaff }
      }),
    )

    const priorityDist = [
      { name: 'P1 Critical', value: activeRequests.filter((r) => (r.priorityOverride ?? r.priority) === 1).length, color: '#ef4444' },
      { name: 'P2 High', value: activeRequests.filter((r) => (r.priorityOverride ?? r.priority) === 2).length, color: '#f59e0b' },
      { name: 'P3 Medium', value: activeRequests.filter((r) => (r.priorityOverride ?? r.priority) === 3).length, color: '#6366f1' },
      { name: 'P4 Low', value: activeRequests.filter((r) => (r.priorityOverride ?? r.priority) === 4).length, color: '#94a3b8' },
    ]

    ok(res, {
      today: {
        open_requests: openCount,
        p1_p2: p1p2,
        sla_breached: breached,
        visits_today: visitsToday,
        prospects_followup: prospectsFollowup,
        unassigned,
        overdue: breached,
        pending_approvals: 0,
      },
      performance: {
        request_trend: trend,
        sla_pct: openCount ? Math.round(((openCount - breached) / openCount) * 100) : 100,
        avg_resolution_hours: 36,
        dealer_activity: dealers.length,
        visit_completion_pct: visits.length ? Math.round((visits.filter((v) => v.status === 'done').length / visits.length) * 100) : 0,
        prospect_conversion_pct: convPct,
        team: teamPerf,
      },
      business_health: {
        active_dealers: dealers.length,
        new_dealers: 0,
        prospect_pipeline: prospects.filter((p) => !['converted', 'dropped'].includes(p.stage)).length,
        conversion_pct: convPct,
        dealer_health: dealerHealth,
        territory_performance: Array.from(territoryMap.entries()).map(([name, v]) => ({ name, ...v })),
      },
      priority_dist: priorityDist,
      urgent_requests: activeRequests
        .filter((r) => (r.priorityOverride ?? r.priority) <= 2)
        .slice(0, 5)
        .map(toRequestDto),
    })
  }),
)
