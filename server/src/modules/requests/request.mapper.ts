import { Request, RequestType, Staff, Dealer, RequestFieldValue, RequestLine, TimelineEntry } from '@prisma/client'

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

/** Safe DTO for dealer portal — no internal notes, staff, ERP info. */
export function toDealerRequestDto(r: RequestWithRelations) {
  return {
    id: r.id,
    ref_no: r.refNo,
    type_name: r.type?.name ?? '',
    title: r.title,
    description: r.description ?? null,
    status: r.status,
    priority: r.priorityOverride ?? r.priority,
    due_at: r.dueAt ? r.dueAt.toISOString() : null,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }
}

export function toRequestDetailsDto(requestId: number, fields: RequestFieldValue[]) {
  return {
    request_id: requestId,
    fields: Object.fromEntries(fields.map((f) => [f.key, f.value])),
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
