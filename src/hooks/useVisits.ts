import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/visits'
import type { Visit, VisitOutcomePayload } from '../api/types'

export const useVisits = () => useQuery({ queryKey: ['visits'], queryFn: () => api.getVisits() })
export const useVisit = (id: number) => useQuery({ queryKey: ['visits', id], queryFn: () => api.getVisit(id) })
export const useVisitTimeline = (id: number) => useQuery({ queryKey: ['visits', id, 'timeline'], queryFn: () => api.getVisitTimeline(id) })

export function useVisitMutations(id: number) {
  const qc = useQueryClient()

  // Invalidate visit detail, visit list, and calendar (all date ranges)
  const inv = (visit?: Visit) => {
    qc.invalidateQueries({ queryKey: ['visits', id] })
    qc.invalidateQueries({ queryKey: ['visits'] })
    qc.invalidateQueries({ queryKey: ['calendar'] })
    // Invalidate dealer timeline if we know the dealer
    if (visit?.dealer_id) {
      qc.invalidateQueries({ queryKey: ['dealers', visit.dealer_id, 'timeline'] })
      qc.invalidateQueries({ queryKey: ['dealers', visit.dealer_id, 'visits'] })
    }
  }

  return {
    start: useMutation({
      mutationFn: () => api.startVisit(id),
      onSuccess: (visit) => inv(visit),
    }),
    outcome: useMutation({
      mutationFn: (data: VisitOutcomePayload) => api.submitVisitOutcome(id, data),
      onSuccess: (visit) => inv(visit),
    }),
  }
}

export function useCreateVisit() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createVisit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['visits'] })
      qc.invalidateQueries({ queryKey: ['calendar'] })
    },
  })
}
