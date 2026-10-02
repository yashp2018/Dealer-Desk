import { CalendarActivity, Dealer, Staff } from '@prisma/client'

type ActivityWithRelations = CalendarActivity & {
  dealer?: Dealer | null
  owner: Staff
}

export type CalendarActivityType =
  | 'task'
  | 'reminder'
  | 'meeting'
  | 'followup'
  | 'callback'
  | 'sales_activity'
  | 'payment_followup'
  | 'delivery'
  | 'service_followup'

export function isActivityOverdue(a: Pick<CalendarActivity, 'startAt' | 'status'>): boolean {
  if (['completed', 'cancelled'].includes(a.status)) return false
  return a.startAt.getTime() < Date.now()
}

export function toCalendarActivityDto(a: ActivityWithRelations) {
  return {
    id: a.id,
    title: a.title,
    description: a.description,
    type: a.type as CalendarActivityType,
    start_at: a.startAt.toISOString(),
    end_at: a.endAt.toISOString(),
    timezone: a.timezone,
    reminder_minutes: a.reminderMinutes,
    dealer_id: a.dealerId ?? null,
    dealer_name: a.dealer?.displayName ?? a.dealer?.name ?? null,
    staff_id: a.ownerStaffId,
    staff_name: a.owner?.name ?? null,
    priority: a.priority,
    status: a.status,
    is_overdue: isActivityOverdue(a),
    completed_at: a.completedAt ? a.completedAt.toISOString() : null,
    created_by: a.createdBy,
    updated_by: a.updatedBy ?? null,
    created_at: a.createdAt.toISOString(),
    updated_at: a.updatedAt.toISOString(),
    client_uuid: a.clientUuid,
  }
}
