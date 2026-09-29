import apiClient from './client'
import { getRequests } from './requests'
import { getVisits } from './visits'
import type { Request, Visit } from './types'
import type { CalendarActivity, CreateCalendarActivityPayload, UpdateCalendarActivityPayload } from '../features/calendar/calendarEventMapper'

export interface CalendarData {
  requests: Request[]
  visits: Visit[]
  activities: CalendarActivity[]
}

export async function getCalendarData(startDate: string, endDate: string): Promise<CalendarData> {
  const params = { start_date: startDate, end_date: endDate }
  const [requests, visits, activities] = await Promise.all([
    getRequests(params),
    getVisits(params),
    getCalendarActivities(startDate, endDate),
  ])
  return { requests, visits, activities }
}

export const getCalendarActivities = (startDate: string, endDate: string): Promise<CalendarActivity[]> =>
  apiClient.get('/calendar', { params: { start_date: startDate, end_date: endDate } })

export const getCalendarActivity = (id: string): Promise<CalendarActivity> =>
  apiClient.get(`/calendar/activities/${id}`)

export const createCalendarActivity = (data: CreateCalendarActivityPayload): Promise<CalendarActivity> =>
  apiClient.post('/calendar/activities', data)

export const updateCalendarActivity = (id: string, data: UpdateCalendarActivityPayload): Promise<CalendarActivity> =>
  apiClient.patch(`/calendar/activities/${id}`, data)

export const deleteCalendarActivity = (id: string): Promise<void> =>
  apiClient.delete(`/calendar/activities/${id}`)

export const completeCalendarActivity = (id: string): Promise<CalendarActivity> =>
  apiClient.post(`/calendar/activities/${id}/complete`)

export const moveCalendarActivity = (id: string, startAt: string, endAt: string): Promise<CalendarActivity> =>
  apiClient.patch(`/calendar/activities/${id}/move`, { start_at: startAt, end_at: endAt })

export const resizeCalendarActivity = (id: string, endAt: string): Promise<CalendarActivity> =>
  apiClient.patch(`/calendar/activities/${id}/resize`, { end_at: endAt })
