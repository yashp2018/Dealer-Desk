/**
 * src/api/portal.ts
 *
 * The entire dealer-portal API surface — every call here hits /portal/*,
 * which the backend gates with requireDealerAuth (a dealer-only token
 * check, structurally separate from the staff `authenticate` pipeline).
 * A staff-logged-in session has no working use for anything in this file.
 */
import apiClient from './client'
import type {
  DealerPortal,
  DealerProfileUpdatePayload,
  DealerRequest,
  DealerCreateRequestPayload,
  PortalTimelineEntry,
  RequestLine,
  RequestTypeField,
  RequestDetails,
  Notification,
} from './types'
import type { ServiceItem } from './services'
import type { Provider } from './providers'

// ── Profile ──────────────────────────────────────────────────────────────

export const getMyProfile = (): Promise<DealerPortal> => apiClient.get('/portal/me')

export const updateMyProfile = (data: DealerProfileUpdatePayload): Promise<DealerPortal> =>
  apiClient.patch('/portal/me', data)

export const changeMyPassword = (data: { current_password: string; new_password: string }): Promise<void> =>
  apiClient.post('/portal/change-password', data)

// ── Requests ─────────────────────────────────────────────────────────────

export interface PortalRequestType {
  id: string
  name: string
  icon: string
  fields: RequestTypeField[]
}

/** Dealer-safe request type picker — NOT /bootstrap (staff-only). */
export const getPortalRequestTypes = (): Promise<PortalRequestType[]> => apiClient.get('/portal/request-types')

export const getMyRequests = (params?: Record<string, string>): Promise<DealerRequest[]> =>
  apiClient.get('/portal/requests', { params })

export const getMyRequest = (id: string): Promise<DealerRequest> =>
  apiClient.get(`/portal/requests/${id}`)

export const getMyRequestTimeline = (id: string): Promise<PortalTimelineEntry[]> =>
  apiClient.get(`/portal/requests/${id}/timeline`)

export const getMyRequestLines = (id: string): Promise<RequestLine[]> =>
  apiClient.get(`/portal/requests/${id}/lines`)

export const getMyRequestDetails = (id: string): Promise<RequestDetails> =>
  apiClient.get(`/portal/requests/${id}/details`)

export const createMyRequest = (data: DealerCreateRequestPayload): Promise<DealerRequest> =>
  apiClient.post('/portal/requests', data)

// ── Catalog (read-only) ──────────────────────────────────────────────────

export const getPortalServices = (params?: { search?: string; category?: number; page?: number; limit?: number }): Promise<ServiceItem[]> =>
  apiClient.get('/portal/services', { params })

export const getPortalService = (id: number): Promise<ServiceItem> =>
  apiClient.get(`/portal/services/${id}`)

export const getPortalProviders = (params?: { search?: string; category?: string; page?: number; limit?: number }): Promise<Provider[]> =>
  apiClient.get('/portal/providers', { params })

export const getPortalProvider = (id: number): Promise<Provider> =>
  apiClient.get(`/portal/providers/${id}`)

export const getPortalProviderServices = (id: number): Promise<Pick<ServiceItem, 'id' | 'serviceCode' | 'name' | 'slug' | 'status' | 'isFeatured'>[]> =>
  apiClient.get(`/portal/providers/${id}/services`)

// ── Notifications ────────────────────────────────────────────────────────

export const getPortalNotifications = (): Promise<Notification[]> => apiClient.get('/portal/notifications')

export const markPortalNotificationRead = (id: number): Promise<Notification> =>
  apiClient.post(`/portal/notifications/${id}/read`)

export const markAllPortalNotificationsRead = (): Promise<void> => apiClient.post('/portal/notifications/read-all')
