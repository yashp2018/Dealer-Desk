import apiClient from './client'
import type { Visit, VisitOutcomePayload, TimelineEntry, VisitAgendaItem, VisitAttachment } from './types'

export const getVisits = (params?: Record<string, string>): Promise<Visit[]> =>
  apiClient.get('/visits', { params })

export const getVisit = (id: string): Promise<Visit> =>
  apiClient.get(`/visits/${id}`)

export const createVisit = (data: { dealer_id?: string; prospect_id?: string; visit_type_id: string; scheduled_at: string; title?: string }): Promise<Visit> =>
  apiClient.post('/visits', data)

export const startVisit = (id: string): Promise<Visit> =>
  apiClient.post(`/visits/${id}/start`)

export const submitVisitOutcome = (id: string, data: VisitOutcomePayload): Promise<Visit> =>
  apiClient.post(`/visits/${id}/outcome`, data)

export const cancelVisit = (id: string): Promise<Visit> =>
  apiClient.post(`/visits/${id}/cancel`)

export const getVisitTimeline = (id: string): Promise<TimelineEntry[]> =>
  apiClient.get(`/visits/${id}/timeline`)

export const addVisitNote = (id: string, body: string): Promise<TimelineEntry> =>
  apiClient.post(`/visits/${id}/notes`, { body })

export const getVisitAgenda = (id: string): Promise<{ items: VisitAgendaItem[] }> =>
  apiClient.get(`/visits/${id}/agenda`)

export const updateVisitAgenda = (id: string, items: VisitAgendaItem[]): Promise<{ items: VisitAgendaItem[] }> =>
  apiClient.patch(`/visits/${id}/agenda`, { items })

export const getVisitAttachments = (id: string): Promise<VisitAttachment[]> =>
  apiClient.get(`/visits/${id}/attachments`)

export const uploadVisitAttachment = (id: string, file: File): Promise<VisitAttachment> => {
  const form = new FormData()
  form.append('file', file)
  return apiClient.post(`/visits/${id}/attachments`, form, { headers: { 'Content-Type': undefined } })
}

export const deleteVisitAttachment = (id: string, attachmentId: string): Promise<void> =>
  apiClient.delete(`/visits/${id}/attachments/${attachmentId}`)

/** Attachment files require the same Authorization header as any other API call, so they're fetched as a blob rather than used as a bare <img src>. */
export const getVisitAttachmentBlob = (url: string): Promise<Blob> =>
  apiClient.get(url, { responseType: 'blob' })
