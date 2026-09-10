import apiClient from './client'
import type { Visit, VisitOutcomePayload, TimelineEntry } from './types'
import { mockVisits, mockTimeline } from './mockData'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const getVisits = (params?: Record<string, string>): Promise<Visit[]> =>
  MOCK ? Promise.resolve(mockVisits as unknown as Visit[]) : apiClient.get('/visits', { params })

export const getVisit = (id: number): Promise<Visit> =>
  MOCK ? Promise.resolve(mockVisits.find((v) => v.id === id) as unknown as Visit) : apiClient.get(`/visits/${id}`)

export const createVisit = (data: { dealer_id?: number; prospect_id?: number; visit_type_id: number; scheduled_at: string; title?: string }): Promise<Visit> =>
  MOCK ? Promise.resolve({ id: Date.now(), ref: 'VIS-NEW', ref_no: 'VIS-NEW', status: 'scheduled', ...data } as unknown as Visit) : apiClient.post('/visits', data)

export const startVisit = (id: number): Promise<Visit> =>
  MOCK ? Promise.resolve({ ...mockVisits.find((v) => v.id === id), status: 'in_progress' } as unknown as Visit) : apiClient.post(`/visits/${id}/start`)

export const submitVisitOutcome = (id: number, data: VisitOutcomePayload): Promise<Visit> =>
  MOCK ? Promise.resolve({ ...mockVisits.find((v) => v.id === id), ...data, status: 'done' } as unknown as Visit) : apiClient.post(`/visits/${id}/outcome`, data)

export const getVisitTimeline = (_id: number): Promise<TimelineEntry[]> =>
  MOCK ? Promise.resolve(mockTimeline as TimelineEntry[]) : apiClient.get(`/visits/${_id}/timeline`)
