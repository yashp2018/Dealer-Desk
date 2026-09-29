import type { Request, Visit } from '../../api/types'

export type CalendarEventType =
  | 'dealer_visit'
  | 'prospect_visit'
  | 'request_due'
  | 'followup'
  | 'task'
  | 'meeting'
  | 'escalation'
  | 'callback'
  | 'reminder'
  | 'visit'
  | 'request'
  | 'p1_request'
  | 'open_request'
  | 'sales_activity'
  | 'payment_followup'
  | 'delivery'
  | 'service_followup'

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

export interface CalendarActivity {
  id: string
  title: string
  description?: string | null
  type: CalendarActivityType
  start_at: string
  end_at: string
  timezone: string
  reminder_minutes?: number | null
  dealer_id?: string | null
  dealer_name?: string | null
  staff_id?: string | null
  staff_name?: string | null
  priority: number
  status: 'scheduled' | 'completed' | 'cancelled'
  is_overdue?: boolean
  completed_at?: string | null
  created_by: string
  updated_by?: string | null
  created_at: string
  updated_at: string
  client_uuid?: string | null
}

export interface CreateCalendarActivityPayload {
  title: string
  description?: string
  type: CalendarActivityType
  start_at: string
  end_at: string
  timezone?: string
  reminder_minutes?: number | null
  dealer_id?: number
  owner_staff_id?: number
  priority?: number
  client_uuid?: string
}

export type UpdateCalendarActivityPayload = Partial<Omit<CreateCalendarActivityPayload, 'client_uuid'>>

export const REMINDER_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'None' },
  { value: 0, label: 'At time of event' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 1440, label: '1 day before' },
]

export const ACTIVITY_TYPE_OPTIONS: { value: CalendarActivityType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'followup', label: 'Follow-up' },
  { value: 'callback', label: 'Callback' },
  { value: 'sales_activity', label: 'Sales Activity' },
  { value: 'payment_followup', label: 'Payment Follow-up' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'service_followup', label: 'Service Follow-up' },
]

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  type: CalendarEventType
  priority?: number
  status: string
  dealerId?: string | number | null
  requestId?: string | number
  visitId?: string | number
  activityId?: string
  dealerName: string
  ownerName?: string | null
  ownerStaffId?: string | number | null
  visitType?: string
  territoryId?: string | number | null
  reminderMinutes?: number | null
  description?: string | null
  isCalendarActivity?: boolean
}

export const activityTypeLabels: Record<string, string> = {
  dealer_visit: 'Dealer Visit',
  prospect_visit: 'Prospect Visit',
  request_due: 'Request Due',
  followup: 'Follow-up',
  task: 'Task',
  meeting: 'Meeting',
  escalation: 'Escalation',
  callback: 'Callback',
  reminder: 'Reminder',
  sales_activity: 'Sales Activity',
  payment_followup: 'Payment Follow-up',
  delivery: 'Delivery',
  service_followup: 'Service Follow-up',
}

export const calendarColors: Record<string, string> = {
  dealer_visit: '#0891b2',
  prospect_visit: '#7c3aed',
  request_due: '#64748b',
  followup: '#f59e0b',
  task: '#6366f1',
  meeting: '#0ea5e9',
  escalation: '#dc2626',
  callback: '#10b981',
  reminder: '#94a3b8',
  visit: '#0891b2',
  p1_request: '#dc2626',
  open_request: '#64748b',
  sales_activity: '#059669',
  payment_followup: '#d97706',
  delivery: '#2563eb',
  service_followup: '#0d9488',
}

function addHours(value: string, hours: number) {
  const date = new Date(value)
  date.setHours(date.getHours() + hours)
  return date.toISOString()
}

export function mapRequestEvent(request: Request): CalendarEvent {
  const isEscalation = request.is_overdue && request.priority === 1

  const type: CalendarEventType = isEscalation
    ? 'escalation'
    : request.priority === 1
      ? 'p1_request'
      : !['done', 'cancelled'].includes(request.status)
        ? 'request_due'
        : 'request'

  const start = request.scheduled_at || request.due_at || request.created_at

  return {
    id: `request-${request.id}`,
    title: request.title || request.type_name,
    start,
    end: addHours(start, 1),
    type,
    priority: request.priority,
    status: request.status,
    dealerId: request.dealer_id,
    requestId: request.id,
    dealerName: request.dealer_name,
    ownerName: request.owner_name,
    ownerStaffId: request.owner_staff_id,
  }
}

export function mapVisitEvent(visit: Visit): CalendarEvent {
  return {
    id: `visit-${visit.id}`,
    title: visit.title || visit.visit_type,
    start: visit.scheduled_at,
    end: addHours(visit.scheduled_at, 1),
    type: 'dealer_visit',
    status: visit.status,
    dealerId: visit.dealer_id,
    visitId: visit.id,
    dealerName: visit.dealer_name,
    ownerName: visit.owner_name,
    ownerStaffId: visit.owner_staff_id,
    visitType: visit.visit_type,
  }
}

export function mapCalendarActivityEvent(
  activity: CalendarActivity,
): CalendarEvent {
  return {
    id: `activity-${activity.id}`,
    activityId: activity.id,
    title: activity.title,
    start: activity.start_at,
    end: activity.end_at,
    type: activity.type,
    status: activity.status,
    priority: activity.priority,
    dealerId: activity.dealer_id,
    dealerName: activity.dealer_name || '',
    ownerName: activity.staff_name,
    ownerStaffId: activity.staff_id,
    reminderMinutes: activity.reminder_minutes,
    description: activity.description,
    isCalendarActivity: true,
  }
}

export function mapCalendarEvents(data: {
  requests: Request[]
  visits: Visit[]
  activities?: CalendarActivity[]
}): CalendarEvent[] {
  return [
    ...data.requests.map(mapRequestEvent),
    ...data.visits.map(mapVisitEvent),
    ...(data.activities ?? []).map(mapCalendarActivityEvent),
  ]
}