/**
 * src/hooks/useServices.ts
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/services'

export function useServices(params?: api.ServiceListParams) {
  return useQuery({
    queryKey: ['services', params],
    queryFn: () => api.getServices(params),
  })
}

export function useService(id?: string) {
  return useQuery({
    queryKey: ['services', id],
    queryFn: () => api.getService(id!),
    enabled: Boolean(id),
  })
}

export function useCreateService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}

export function useUpdateService(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<api.CreateServicePayload>) => api.updateService(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['services'] })
      qc.invalidateQueries({ queryKey: ['services', id] })
    },
  })
}

export function useDeleteService() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['services'] }),
  })
}
