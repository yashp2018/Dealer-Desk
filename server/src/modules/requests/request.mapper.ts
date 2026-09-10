import mongoose from 'mongoose'
import { IRequest, IRequestFieldValue, IRequestLine } from '../../models/request.model'
import { IRequestType } from '../../models/requestType.model'
import { IStaff } from '../../models/staff.model'
import { IDealer } from '../../models/dealer.model'
import { ITimelineEntry } from '../../models/timeline.model'

type RequestWithRelations = Omit<IRequest, 'typeId' | 'ownerStaffId' | 'dealerId'> & {
  typeId: IRequestType | mongoose.Types.ObjectId
  ownerStaffId?: IStaff | mongoose.Types.ObjectId | null
  dealerId?: IDealer | mongoose.Types.ObjectId | null
}

export function isOverdue(r: Pick<IRequest, 'dueAt' | 'status'>): boolean {
  if (!r.dueAt) return false
  if (['done', 'cancelled'].includes(r.status)) return false
  return r.dueAt.getTime() < Date.now()
}

export function toRequestDto(r: RequestWithRelations) {
  const type = r.typeId as IRequestType
  const owner = r.ownerStaffId as IStaff | null | undefined
  const dealer = r.dealerId as IDealer | null | undefined
  return {
    id: String(r._id),
    ref: r.refNo,
    ref_no: r.refNo,
    title: r.title,
    type_id: String(type?._id ?? r.typeId),
    type_name: type?.name ?? '',
    type_icon: type?.icon ?? '',
    status: r.status,
    priority: r.priorityOverride ?? r.priority,
    priority_override: r.priorityOverride ?? null,
    priority_reason: r.priorityReason ?? null,
    dealer_id: dealer ? String((dealer as { _id?: unknown })._id ?? r.dealerId) : null,
    dealer_name: dealer?.name ?? '',
    dealer_city: dealer?.city ?? '',
    owner_staff_id: owner ? String((owner as { _id?: unknown })._id ?? r.ownerStaffId) : null,
    owner_name: owner?.name ?? null,
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
  const type = r.typeId as IRequestType
  return {
    id: String(r._id),
    ref_no: r.refNo,
    type_name: type?.name ?? '',
    title: r.title,
    description: r.description ?? null,
    status: r.status,
    priority: r.priorityOverride ?? r.priority,
    due_at: r.dueAt ? r.dueAt.toISOString() : null,
    created_at: r.createdAt.toISOString(),
    updated_at: r.updatedAt.toISOString(),
  }
}

export function toRequestDetailsDto(requestId: string, fields: IRequestFieldValue[]) {
  return {
    request_id: requestId,
    fields: Object.fromEntries(fields.map((f) => [f.key, f.value])),
  }
}

export function toRequestLineDto(l: IRequestLine) {
  return {
    id: String(l._id),
    request_id: String(l.requestId),
    description: l.description,
    qty: l.qty,
    unit_rate: l.unitRate ?? null,
    total: l.total ?? null,
  }
}

export function toTimelineDto(t: ITimelineEntry & { actorStaffId?: IStaff | mongoose.Types.ObjectId | null }) {
  const actor = t.actorStaffId as IStaff | null | undefined
  return {
    id: String(t._id),
    created_at: t.createdAt.toISOString(),
    actor_name: actor?.name ?? 'System',
    actor_staff_id: actor ? String((actor as { _id?: unknown })._id ?? t.actorStaffId) : null,
    event_type: t.eventType,
    summary: t.summary,
  }
}
