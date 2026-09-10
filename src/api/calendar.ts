import { getRequests } from './requests'
import { getVisits } from './visits'
import type { Request, Visit } from './types'

export interface CalendarData {
  requests: Request[]
  visits: Visit[]
}

export async function getCalendarData(startDate: string, endDate: string): Promise<CalendarData> {
  const params = { start_date: startDate, end_date: endDate }
  const [requests, visits] = await Promise.all([getRequests(params), getVisits(params)])
  return { requests, visits }
}
