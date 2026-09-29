import apiClient from './client'
import type { Request, RequestDetails, RequestLine, TimelineEntry, CreateRequestPayload } from './types'

export const getRequests = (params?: Record<string, string>): Promise<Request[]> =>
  apiClient.get('/requests', { params })

export const searchRequests = (q: string): Promise<Request[]> =>
  apiClient.get('/requests', { params: { q } })

export const getRequest = (id: string): Promise<Request> =>
  apiClient.get(`/requests/${id}`)

export const getRequestDetails = (id: string): Promise<RequestDetails> =>
  apiClient.get(`/requests/${id}/details`)

export const getRequestLines = (id: string): Promise<RequestLine[]> =>
  apiClient.get(`/requests/${id}/lines`)

export const getRequestTimeline = (id: string): Promise<TimelineEntry[]> =>
  apiClient.get(`/requests/${id}/timeline`)

export interface EscalationLogEntry {
  id: number
  rule_id: number
  rule_name: string
  action_taken: string
  fired_at: string
}

export const getRequestEscalations = (id: string): Promise<EscalationLogEntry[]> =>
  apiClient.get(`/requests/${id}/escalations`)

export const createRequest = (data: CreateRequestPayload): Promise<Request> =>
  apiClient.post('/requests', data)

export const setRequestStatus = (id: string, status: string): Promise<Request> =>
  apiClient.post(`/requests/${id}/status`, { status })

export const assignRequest = (id: string, staff_id: string): Promise<Request> =>
  apiClient.post(`/requests/${id}/assign`, { staff_id })

export const setRequestPriority = (id: string, priority: number): Promise<Request> =>
  apiClient.post(`/requests/${id}/priority`, { priority })

export const rescheduleRequest = (id: string, due_at: string): Promise<Request> =>
  apiClient.post(`/requests/${id}/reschedule`, { due_at })

export const addRequestNote = (id: string, note: string): Promise<TimelineEntry> =>
  apiClient.post(`/requests/${id}/notes`, { body: note })

export const pushRequest = (id: string): Promise<{ pushed: boolean }> =>
  apiClient.post(`/requests/${id}/push`)

export const reviseRequest = (id: string, reason: string): Promise<Request> =>
  apiClient.post(`/requests/${id}/revise`, { reason })

export const saveRequestHandling = (id: string, data: { owner_staff_id?: string; scheduled_at?: string; priority?: number }): Promise<Request> =>
  apiClient.post(`/requests/${id}/handling`, data)

export const saveRequestDetails = (id: string, fields: Record<string, string>): Promise<RequestDetails> =>
  apiClient.post(`/requests/${id}/details`, { fields })

export const deleteRequest = (id: string): Promise<void> =>
  apiClient.delete(`/requests/${id}`)
