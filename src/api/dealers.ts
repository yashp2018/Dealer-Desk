import apiClient from './client'
import type { Dealer, DealerContact, DealerUpdatePayload, DealerPortal, DealerRequest, Request, TimelineEntry, Visit } from './types'

export const getDealers = (params?: Record<string, string>): Promise<{ items: Dealer[]; meta?: Record<string, unknown> }> =>
  apiClient.get('/dealers', { params })

export const getDealer = (id: string): Promise<Dealer> =>
  apiClient.get(`/dealers/${id}`)

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

// ── Dealer Portal endpoints ───────────────────────────────────────────────────

/** Get the authenticated dealer's own profile (safe fields only). */
export const getMyDealer = (): Promise<DealerPortal> =>
  apiClient.get('/dealers/me')

/** Get the authenticated dealer's own requests. */
export const getMyRequests = (params?: Record<string, string>): Promise<{ items: DealerRequest[]; meta?: Record<string, unknown> }> =>
  apiClient.get('/dealers/me/requests', { params })
