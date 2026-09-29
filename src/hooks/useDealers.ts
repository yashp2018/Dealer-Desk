import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/dealers'
import type { CreateDealerPayload, DealerUpdatePayload } from '../api/types'

export const useDealers = () => useQuery({ queryKey: ['dealers'], queryFn: () => api.getDealers() })
export const useDealer = (id: string) => useQuery({ queryKey: ['dealers', id], queryFn: () => api.getDealer(id), enabled: !!id })

export function useCreateDealer() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateDealerPayload) => api.createDealer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dealers'] })
      qc.invalidateQueries({ queryKey: ['dealer-import-candidates'] })
    },
  })
}

export const useImportCandidates = (q?: string) =>
  useQuery({ queryKey: ['dealer-import-candidates', q ?? ''], queryFn: () => api.getImportCandidates(q) })

export function useImportDealers() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => api.importDealers(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dealer-import-candidates'] }),
  })
}
export const useDealerRequests = (id: string) => useQuery({ queryKey: ['dealers', id, 'requests'], queryFn: () => api.getDealerRequests(id), enabled: !!id })
export const useDealerContacts = (id: string) => useQuery({ queryKey: ['dealers', id, 'contacts'], queryFn: () => api.getDealerContacts(id), enabled: !!id })
export const useDealerVisits = (id: string) => useQuery({ queryKey: ['dealers', id, 'visits'], queryFn: () => api.getDealerVisits(id), enabled: !!id })
export const useDealerTimeline = (id: string) => useQuery({ queryKey: ['dealers', id, 'timeline'], queryFn: () => api.getDealerTimeline(id), enabled: !!id })

export function useUpdateDealer(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: DealerUpdatePayload) => api.updateDealer(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dealers', id] })
      qc.invalidateQueries({ queryKey: ['dealers'] })
    },
  })
}

export function useAddDealerContact(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { name: string; role_label?: string; phone?: string }) => api.addDealerContact(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dealers', id, 'contacts'] }),
  })
}
