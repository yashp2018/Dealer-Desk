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
  // legacy aliases kept for backward compat
  | 'visit'
  | 'request'
  | 'p1_request'
  | 'open_request'

export interface CalendarEvent {
  id: string
  title: string
  start: string
  end?: string
  type: CalendarEventType
  priority?: number
  status: string
  dealerId?: number | null
  requestId?: number
  visitId?: number
  dealerName: string
  ownerName?: string | null
  ownerStaffId?: number | null
  visitType?: string
  territoryId?: number | null
}

export const activityTypeLabels: Record<string, string> = {
  dealer_visit:   'Dealer Visit',
  prospect_visit: 'Prospect Visit',
  request_due:    'Request Due',
  followup:       'Follow-up',
  task:           'Task',
  meeting:        'Meeting',
  escalation:     'Escalation',
  callback:       'Callback',
  reminder:       'Reminder',
}

export const calendarColors: Record<string, string> = {
  dealer_visit:   '#0891b2',   // cyan
  prospect_visit: '#7c3aed',   // violet
  request_due:    '#64748b',   // slate
  followup:       '#f59e0b',   // amber
  task:           '#6366f1',   // indigo
  meeting:        '#0ea5e9',   // sky
  escalation:     '#dc2626',   // red
  callback:       '#10b981',   // emerald
  reminder:       '#94a3b8',   // slate-light
  // legacy
  visit:          '#0891b2',
  p1_request:     '#dc2626',
  open_request:   '#64748b',
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

  return {
    id: `request-${request.id}`,
    title: request.title || request.type_name,
    start: request.scheduled_at || request.due_at || request.created_at,
    end: addHours(request.scheduled_at || request.due_at || request.created_at, 1),
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

export function mapCalendarEvents(data: { requests: Request[]; visits: Visit[] }): CalendarEvent[] {
  return [...data.requests.map(mapRequestEvent), ...data.visits.map(mapVisitEvent)]
}
