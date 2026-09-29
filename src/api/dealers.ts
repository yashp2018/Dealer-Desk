import apiClient from './client'
import type {
  CreateDealerPayload,
  Dealer,
  DealerContact,
  DealerImportCandidate,
  DealerImportResult,
  DealerUpdatePayload,
  Request,
  TimelineEntry,
  Visit,
} from './types'

export const getDealers = (params?: Record<string, string>): Promise<Dealer[]> =>
  apiClient.get('/dealers', { params })

export const getDealer = (id: string): Promise<Dealer> =>
  apiClient.get(`/dealers/${id}`)

export const createDealer = (data: CreateDealerPayload): Promise<Dealer> =>
  apiClient.post('/dealers', data)

export const importDealers = (file: File): Promise<DealerImportResult> => {
  const form = new FormData()
  form.append('file', file)
  return apiClient.post('/dealers/import', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export const getImportCandidates = (q?: string): Promise<DealerImportCandidate[]> =>
  apiClient.get('/dealers/import/candidates', { params: q ? { q } : undefined })

export const updateDealer = (id: string, data: DealerUpdatePayload): Promise<Dealer> =>
  apiClient.put(`/dealers/${id}`, data)

export const getDealerContacts = (id: string): Promise<DealerContact[]> =>
  apiClient.get(`/dealers/${id}/contacts`)

export const addDealerContact = (id: string, data: { name: string; role_label?: string; phone?: string }): Promise<DealerContact> =>
  apiClient.post(`/dealers/${id}/contacts`, data)

export const getDealerRequests = (id: string): Promise<Request[]> =>
  apiClient.get(`/dealers/${id}/requests`)

export const getDealerVisits = (id: string): Promise<Visit[]> =>
  apiClient.get(`/dealers/${id}/visits`)

export const getDealerTimeline = (id: string): Promise<TimelineEntry[]> =>
  apiClient.get(`/dealers/${id}/timeline`)
