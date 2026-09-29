import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/prospects'

export const useProspects = () => useQuery({ queryKey: ['prospects'], queryFn: api.getProspects })
export const useProspect = (id: number) => useQuery({ queryKey: ['prospects', id], queryFn: () => api.getProspect(id) })
export const useProspectVisits = (id: number) => useQuery({ queryKey: ['prospects', id, 'visits'], queryFn: () => api.getProspectVisits(id) })
export const useProspectChecklist = (id: number) => useQuery({ queryKey: ['prospects', id, 'checklist'], queryFn: () => api.getProspectChecklist(id) })

export function useCreateProspect() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.createProspect, onSuccess: () => qc.invalidateQueries({ queryKey: ['prospects'] }) })
}

export function useProspectMutations(id: number) {
  const qc = useQueryClient()
  const inv = () => { qc.invalidateQueries({ queryKey: ['prospects', id] }); qc.invalidateQueries({ queryKey: ['prospects'] }) }
  return {
    setStage: useMutation({ mutationFn: (stage: string) => api.setProspectStage(id, stage), onSuccess: inv }),
    convert: useMutation({ mutationFn: (tierId?: number) => api.convertProspect(id, tierId), onSuccess: inv }),
    setOnboardingItem: useMutation({
      mutationFn: (vars: { item_id: number; status: string }) => api.setOnboardingItem(id, vars.item_id, vars.status),
      onSuccess: inv,
    }),
  }
}
