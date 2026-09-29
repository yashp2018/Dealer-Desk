import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/portal'
import type { DealerProfileUpdatePayload } from '../api/types'

// ── Profile ──────────────────────────────────────────────────────────────

export const useMyProfile = () => useQuery({ queryKey: ['portal', 'me'], queryFn: api.getMyProfile })

export function useUpdateMyProfile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: DealerProfileUpdatePayload) => api.updateMyProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal', 'me'] }),
  })
}

export function useChangeMyPassword() {
  return useMutation({
    mutationFn: (data: { current_password: string; new_password: string }) => api.changeMyPassword(data),
  })
}

// ── Requests ─────────────────────────────────────────────────────────────

export const usePortalRequestTypes = () =>
  useQuery({ queryKey: ['portal', 'request-types'], queryFn: api.getPortalRequestTypes, staleTime: Infinity })

export const useMyRequests = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['portal', 'requests', params], queryFn: () => api.getMyRequests(params) })

export const useMyRequest = (id?: string) =>
  useQuery({ queryKey: ['portal', 'requests', id], queryFn: () => api.getMyRequest(id!), enabled: !!id })

export const useMyRequestTimeline = (id?: string) =>
  useQuery({ queryKey: ['portal', 'requests', id, 'timeline'], queryFn: () => api.getMyRequestTimeline(id!), enabled: !!id })

export const useMyRequestLines = (id?: string) =>
  useQuery({ queryKey: ['portal', 'requests', id, 'lines'], queryFn: () => api.getMyRequestLines(id!), enabled: !!id })

export const useMyRequestDetails = (id?: string) =>
  useQuery({ queryKey: ['portal', 'requests', id, 'details'], queryFn: () => api.getMyRequestDetails(id!), enabled: !!id })

export function useCreateMyRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createMyRequest,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal', 'requests'] }),
  })
}

// ── Catalog (read-only) ──────────────────────────────────────────────────

export const usePortalServices = (params?: { search?: string; category?: number }) =>
  useQuery({ queryKey: ['portal', 'services', params], queryFn: () => api.getPortalServices(params) })

export const usePortalService = (id?: number) =>
  useQuery({ queryKey: ['portal', 'services', id], queryFn: () => api.getPortalService(id!), enabled: !!id })

export const usePortalProviders = (params?: { search?: string; category?: string }) =>
  useQuery({ queryKey: ['portal', 'providers', params], queryFn: () => api.getPortalProviders(params) })

export const usePortalProvider = (id?: number) =>
  useQuery({ queryKey: ['portal', 'providers', id], queryFn: () => api.getPortalProvider(id!), enabled: !!id })

export const usePortalProviderServices = (id?: number) =>
  useQuery({ queryKey: ['portal', 'providers', id, 'services'], queryFn: () => api.getPortalProviderServices(id!), enabled: !!id })

// ── Notifications ────────────────────────────────────────────────────────

export const usePortalNotifications = () =>
  useQuery({ queryKey: ['portal', 'notifications'], queryFn: api.getPortalNotifications, refetchInterval: 60_000 })

export function useMarkPortalNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.markPortalNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal', 'notifications'] }),
  })
}

export function useMarkAllPortalNotificationsRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.markAllPortalNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['portal', 'notifications'] }),
  })
}
