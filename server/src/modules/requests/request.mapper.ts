import { Request, RequestType, Staff, Dealer, RequestFieldValue, RequestLine, TimelineEntry, EscalationLog } from '@prisma/client'

type RequestWithRelations = Request & {
  type: RequestType
  owner?: Staff | null
  dealer?: Dealer | null
}

export function isOverdue(r: Pick<Request, 'dueAt' | 'status'>): boolean {
  if (!r.dueAt) return false
  if (['done', 'cancelled'].includes(r.status)) return false
  return r.dueAt.getTime() < Date.now()
}

export function toRequestDto(r: RequestWithRelations) {
  return {
    id: r.id,
    ref: r.refNo,
    ref_no: r.refNo,
    title: r.title,
    type_id: r.typeId,
    type_name: r.type?.name ?? '',
    type_icon: r.type?.icon ?? '',
    status: r.status,
    priority: r.priorityOverride ?? r.priority,
    priority_override: r.priorityOverride ?? null,
    priority_reason: r.priorityReason ?? null,
    dealer_id: r.dealerId,
    dealer_name: r.dealer?.name ?? '',
    dealer_city: r.dealer?.city ?? '',
    owner_staff_id: r.ownerStaffId,
    owner_name: r.owner?.name ?? null,
    due_at: r.dueAt ? r.dueAt.toISOString() : null,
    scheduled_at: r.scheduledAt ? r.scheduledAt.toISOString() : null,
    created_at: r.createdAt.toISOString(),
    is_overdue: isOverdue(r),
    completion_done: r.completionDone,
    completion_required: r.completionRequired,
    closed_reason: r.closedReason ?? null,
    done_at: r.doneAt ? r.doneAt.toISOString() : null,
  }
}

/**
 * Dealer-facing status vocabulary. Deliberately coarser than the internal
 * workflow: a dealer never sees "waiting_internal" vs "pending" vs "open" —
 * those distinctions are staff routing detail, not something a dealer needs
 * or should be able to infer their SLA/priority handling from.
 */
const DEALER_STATUS_LABELS: Record<string, string> = {
  new: 'Received',
  open: 'In Progress',
  pending: 'In Progress',
  waiting_dealer: 'In Progress',
  waiting_internal: 'In Progress',
  done: 'Completed',
  cancelled: 'Cancelled',
}

export function toDealerStatusLabel(status: string): string {
  return DEALER_STATUS_LABELS[status] ?? 'In Progress'
}

/**
 * Safe DTO for the dealer portal. Deliberately excludes priority,
 * priority_override/reason, owner_staff_id, due_at (SLA-derived), and any
 * internal note/ERP fields — a dealer never sees the internal workflow
 * state, only what they submitted and a coarse status.
 */
export function toDealerRequestDto(r: RequestWithRelations) {
  return {
    id: r.id,
    ref_no: r.refNo,
    type_name: r.type?.name ?? '',
    title: r.title,
    description: r.description ?? null,
    status: toDealerStatusLabel(r.status),
    // The dealer's own preferred appointment time — safe to show since they
    // submitted it themselves. Not the same thing as due_at (SLA-derived,
    // internal, deliberately excluded above).
    scheduled_at: r.scheduledAt ? r.scheduledAt.toISOString() : null,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }
}

const DEALER_VISIBLE_EVENT_TYPES = new Set(['created', 'status_changed'])

/**
 * Dealer-safe timeline: only the two event types a dealer is allowed to see,
 * and generic re-worded summaries — never the internal note/assignment/
 * priority/ERP timeline entries or their raw text (which can name staff,
 * internal statuses, or SLA reasoning).
 */
export function toDealerTimelineEntries(entries: TimelineEntry[]) {
  return entries
    .filter((e) => DEALER_VISIBLE_EVENT_TYPES.has(e.eventType))
    .map((e) => ({
      id: e.id,
      created_at: e.createdAt.toISOString(),
      event_type: e.eventType,
      summary: e.eventType === 'created' ? 'Request submitted' : 'Status updated',
    }))
}

export function toRequestDetailsDto(requestId: string, fields: RequestFieldValue[]) {
  const groups: Record<string, string>[] = []
  for (const f of fields) {
    groups[f.groupIndex] = { ...(groups[f.groupIndex] ?? {}), [f.key]: f.value }
  }
  return {
    request_id: requestId,
    // One entry per repeated field group (e.g. one per vehicle on a warranty claim).
    // Always an array, even for the common single-group case, so callers don't
    // need two code paths.
    fields: groups.filter(Boolean),
  }
}

export function toRequestLineDto(l: RequestLine) {
  return {
    id: l.id,
    request_id: l.requestId,
    description: l.description,
    qty: l.qty,
    unit_rate: l.unitRate ?? null,
    total: l.total ?? null,
  }
}

export function toTimelineDto(t: TimelineEntry & { actor?: Staff | null }) {
  return {
    id: t.id,
    created_at: t.createdAt.toISOString(),
    actor_name: t.actor?.name ?? 'System',
    actor_staff_id: t.actorStaffId,
    event_type: t.eventType,
    summary: t.summary,
  }
}

export function toEscalationLogDto(e: EscalationLog & { rule: { name: string } }) {
  return {
    id: e.id,
    rule_id: e.ruleId,
    rule_name: e.rule.name,
    action_taken: e.actionTaken,
    fired_at: e.firedAt.toISOString(),
  }
}
