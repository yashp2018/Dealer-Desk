import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/setup'

export const useRequestTypesAdmin = () => useQuery({ queryKey: ['setup', 'request-types'], queryFn: api.getRequestTypes })

export function useCreateRequestType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createRequestType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setup', 'request-types'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
  })
}

export function useUpdateRequestType(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<api.RequestTypePayload>) => api.updateRequestType(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setup', 'request-types'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
  })
}

export const useTiersAdmin = () => useQuery({ queryKey: ['setup', 'tiers'], queryFn: api.getTiers })

export function useCreateTier() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createTier,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setup', 'tiers'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
  })
}

export function useUpdateTier(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<api.TierPayload>) => api.updateTier(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setup', 'tiers'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
  })
}

export const useVisitTypesAdmin = () => useQuery({ queryKey: ['setup', 'visit-types'], queryFn: api.getVisitTypesAdmin })

export function useCreateVisitType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createVisitType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setup', 'visit-types'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
  })
}

export function useUpdateVisitType(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<api.VisitTypePayload>) => api.updateVisitType(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setup', 'visit-types'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
  })
}

export function useDeleteVisitType() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.deleteVisitType,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setup', 'visit-types'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
  })
}

export const useEscalationRules = () => useQuery({ queryKey: ['setup', 'escalation-rules'], queryFn: api.getEscalationRules })

export function useCreateEscalationRule() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createEscalationRule,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setup', 'escalation-rules'] }),
  })
}

export function useUpdateEscalationRule(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<api.EscalationRulePayload>) => api.updateEscalationRule(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['setup', 'escalation-rules'] }),
  })
}

export function useRunEscalationRulesNow() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.runEscalationRulesNow,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setup', 'escalation-rules'] })
      qc.invalidateQueries({ queryKey: ['notifications'] })
    },
  })
}

export const useRoles = () => useQuery({ queryKey: ['setup', 'roles'], queryFn: api.getRoles, staleTime: Infinity })

export const useStaffAdmin = () => useQuery({ queryKey: ['setup', 'staff'], queryFn: api.getStaff })

export function useCreateStaff() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: api.createStaff,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setup', 'staff'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
  })
}

export function useUpdateStaff(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: api.StaffUpdatePayload) => api.updateStaff(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['setup', 'staff'] })
      qc.invalidateQueries({ queryKey: ['bootstrap'] })
    },
  })
}
