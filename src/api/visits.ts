import apiClient from './client'
import type { Visit, VisitOutcomePayload, TimelineEntry, VisitAgendaItem, VisitAttachment } from './types'

export const getVisits = (params?: Record<string, string>): Promise<Visit[]> =>
  apiClient.get('/visits', { params })

export const getVisit = (id: number): Promise<Visit> =>
  apiClient.get(`/visits/${id}`)

export const createVisit = (data: { dealer_id?: number; prospect_id?: number; visit_type_id: number; scheduled_at: string; title?: string }): Promise<Visit> =>
  apiClient.post('/visits', data)

export const startVisit = (id: number): Promise<Visit> =>
  apiClient.post(`/visits/${id}/start`)

export const submitVisitOutcome = (id: number, data: VisitOutcomePayload): Promise<Visit> =>
  apiClient.post(`/visits/${id}/outcome`, data)

export const cancelVisit = (id: number): Promise<Visit> =>
  apiClient.post(`/visits/${id}/cancel`)

export const getVisitTimeline = (id: number): Promise<TimelineEntry[]> =>
  apiClient.get(`/visits/${id}/timeline`)

export const addVisitNote = (id: number, body: string): Promise<TimelineEntry> =>
  apiClient.post(`/visits/${id}/notes`, { body })

export const getVisitAgenda = (id: number): Promise<{ items: VisitAgendaItem[] }> =>
  apiClient.get(`/visits/${id}/agenda`)

export const updateVisitAgenda = (id: number, items: VisitAgendaItem[]): Promise<{ items: VisitAgendaItem[] }> =>
  apiClient.patch(`/visits/${id}/agenda`, { items })

export const getVisitAttachments = (id: number): Promise<VisitAttachment[]> =>
  apiClient.get(`/visits/${id}/attachments`)

export const uploadVisitAttachment = (id: number, file: File): Promise<VisitAttachment> => {
  const form = new FormData()
  form.append('file', file)
  // apiClient defaults Content-Type to application/json for every request, which makes
  // axios JSON-encode the FormData instead of sending multipart — clear it here so the
  // browser sets its own multipart/form-data header (with boundary) for this call only.
  return apiClient.post(`/visits/${id}/attachments`, form, { headers: { 'Content-Type': undefined } })
}

export const deleteVisitAttachment = (id: number, attachmentId: number): Promise<void> =>
  apiClient.delete(`/visits/${id}/attachments/${attachmentId}`)

/** Attachment files require the same Authorization header as any other API call, so they're fetched as a blob rather than used as a bare <img src>. */
export const getVisitAttachmentBlob = (url: string): Promise<Blob> =>
  apiClient.get(url, { responseType: 'blob' })
