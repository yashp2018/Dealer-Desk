import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/visits'
import type { Visit, VisitAgendaItem, VisitOutcomePayload } from '../api/types'

export const useVisits = () => useQuery({ queryKey: ['visits'], queryFn: () => api.getVisits() })
export const useVisit = (id: number) => useQuery({ queryKey: ['visits', id], queryFn: () => api.getVisit(id) })
export const useVisitTimeline = (id: number) => useQuery({ queryKey: ['visits', id, 'timeline'], queryFn: () => api.getVisitTimeline(id) })
export const useVisitAgenda = (id: number) => useQuery({ queryKey: ['visits', id, 'agenda'], queryFn: () => api.getVisitAgenda(id) })
export const useVisitAttachments = (id: number) => useQuery({ queryKey: ['visits', id, 'attachments'], queryFn: () => api.getVisitAttachments(id) })

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
    cancel: useMutation({
      mutationFn: () => api.cancelVisit(id),
      onSuccess: (visit) => inv(visit),
    }),
    addNote: useMutation({
      mutationFn: (body: string) => api.addVisitNote(id, body),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['visits', id, 'timeline'] }),
    }),
    updateAgenda: useMutation({
      mutationFn: (items: VisitAgendaItem[]) => api.updateVisitAgenda(id, items),
      onSuccess: (data) => qc.setQueryData(['visits', id, 'agenda'], data),
    }),
    uploadAttachment: useMutation({
      mutationFn: (file: File) => api.uploadVisitAttachment(id, file),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['visits', id, 'attachments'] }),
    }),
    deleteAttachment: useMutation({
      mutationFn: (attachmentId: number) => api.deleteVisitAttachment(id, attachmentId),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['visits', id, 'attachments'] }),
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
