/**
 * src/hooks/useProviders.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/providers'

export function useProviders(params?: api.ProviderListParams) {
  return useQuery({
    queryKey: ['providers', params],
    queryFn: () => api.getProviders(params),
  })
}

export function useProvider(id?: number) {
  return useQuery({
    queryKey: ['providers', id],
    queryFn: () => api.getProvider(id!),
    enabled: Boolean(id),
  })
}

export function useProviderServices(id?: number) {
  return useQuery({
    queryKey: ['providers', id, 'services'],
    queryFn: () => api.getProviderServices(id!),
    enabled: Boolean(id),
  })
}

export function useCreateProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createProvider,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  })
}

export function useUpdateProvider(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<api.Provider>) => api.updateProvider(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['providers'] })
      qc.invalidateQueries({ queryKey: ['providers', id] })
    },
  })
}

export function useDeleteProvider() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteProvider,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['providers'] }),
  })
}
