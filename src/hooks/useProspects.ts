import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/prospects'

export const useProspects = () => useQuery({ queryKey: ['prospects'], queryFn: api.getProspects })
export const useProspect = (id: number) => useQuery({ queryKey: ['prospects', id], queryFn: () => api.getProspect(id) })
export const useProspectVisits = (id: number) => useQuery({ queryKey: ['prospects', id, 'visits'], queryFn: () => api.getProspectVisits(id) })

export function useProspectMutations(id: number) {
  const qc = useQueryClient()
  const inv = () => { qc.invalidateQueries({ queryKey: ['prospects', id] }); qc.invalidateQueries({ queryKey: ['prospects'] }) }
  return {
    setStage: useMutation({ mutationFn: (stage: string) => api.setProspectStage(id, stage), onSuccess: inv }),
    convert: useMutation({ mutationFn: () => api.convertProspect(id), onSuccess: inv }),
    setOnboardingItem: useMutation({ mutationFn: (item_id: number) => api.setOnboardingItem(id, item_id, 'received'), onSuccess: inv }),
  }
}
