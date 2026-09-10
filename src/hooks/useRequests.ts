import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/requests'

export const useRequests = (params?: Record<string, string>) =>
  useQuery({ queryKey: ['requests', params], queryFn: () => api.getRequests(params) })

export const useRequest = (id: string) =>
  useQuery({ queryKey: ['requests', id], queryFn: () => api.getRequest(id), enabled: !!id })

export const useRequestDetails = (id: string) =>
  useQuery({ queryKey: ['requests', id, 'details'], queryFn: () => api.getRequestDetails(id), enabled: !!id })

export const useRequestLines = (id: string) =>
  useQuery({ queryKey: ['requests', id, 'lines'], queryFn: () => api.getRequestLines(id), enabled: !!id })

export const useRequestTimeline = (id: string) =>
  useQuery({ queryKey: ['requests', id, 'timeline'], queryFn: () => api.getRequestTimeline(id), enabled: !!id })

export function useRequestMutations(id: string) {
  const qc = useQueryClient()
  const inv = () => { qc.invalidateQueries({ queryKey: ['requests', id] }); qc.invalidateQueries({ queryKey: ['requests'] }) }
  return {
    setStatus: useMutation({ mutationFn: (status: string) => api.setRequestStatus(id, status), onSuccess: inv }),
    assign: useMutation({ mutationFn: (staff_id: string) => api.assignRequest(id, staff_id), onSuccess: inv }),
    setPriority: useMutation({ mutationFn: (priority: number) => api.setRequestPriority(id, priority), onSuccess: inv }),
    reschedule: useMutation({ mutationFn: (due_at: string) => api.rescheduleRequest(id, due_at), onSuccess: inv }),
    addNote: useMutation({ mutationFn: (note: string) => api.addRequestNote(id, note), onSuccess: inv }),
    push: useMutation({ mutationFn: () => api.pushRequest(id), onSuccess: inv }),
    revise: useMutation({ mutationFn: (reason: string) => api.reviseRequest(id, reason), onSuccess: inv }),
  }
}

export function useCreateRequest() {
  const qc = useQueryClient()
  return useMutation({ mutationFn: api.createRequest, onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }) })
}
