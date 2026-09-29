import apiClient from './client'

export interface RequestTypeAdmin {
  id: number
  name: string
  slug: string
  icon: string
  color: string
  default_priority: number
  sla_hours: number
  push_target: string | null
  allows_prospect: boolean
  goes_through_production: boolean
  question_count: number
}

export interface RequestTypePayload {
  name: string
  slug: string
  icon?: string
  color?: string
  default_priority: number
  sla_hours: number
  push_target?: string
  allows_prospect?: boolean
  goes_through_production?: boolean
}

export const getRequestTypes = (): Promise<RequestTypeAdmin[]> => apiClient.get('/setup/request-types')

export const createRequestType = (data: RequestTypePayload): Promise<RequestTypeAdmin> =>
  apiClient.post('/setup/request-types', data)

export const updateRequestType = (id: number, data: Partial<RequestTypePayload>): Promise<RequestTypeAdmin> =>
  apiClient.patch(`/setup/request-types/${id}`, data)

export interface TierAdmin {
  id: number
  name: string
  rank: number
  priority_boost: number
  multiplier: number
  color: string
}

export interface TierPayload {
  name: string
  rank: number
  priority_boost: number
  multiplier: number
  color?: string
}

export const getTiers = (): Promise<TierAdmin[]> => apiClient.get('/setup/tiers')

export const createTier = (data: TierPayload): Promise<TierAdmin> => apiClient.post('/setup/tiers', data)

export const updateTier = (id: number, data: Partial<TierPayload>): Promise<TierAdmin> =>
  apiClient.patch(`/setup/tiers/${id}`, data)

export interface VisitTypeAdmin {
  id: number
  name: string
}

export interface VisitTypePayload {
  name: string
}

export const getVisitTypesAdmin = (): Promise<VisitTypeAdmin[]> => apiClient.get('/setup/visit-types')

export const createVisitType = (data: VisitTypePayload): Promise<VisitTypeAdmin> =>
  apiClient.post('/setup/visit-types', data)

export const updateVisitType = (id: number, data: Partial<VisitTypePayload>): Promise<VisitTypeAdmin> =>
  apiClient.patch(`/setup/visit-types/${id}`, data)

export const deleteVisitType = (id: number): Promise<void> => apiClient.delete(`/setup/visit-types/${id}`)

export type EscalationActionType = 'notify_owner' | 'notify_role' | 'reassign'

export interface EscalationRuleAdmin {
  id: number
  name: string
  is_active: boolean
  trigger_priority: number | null
  trigger_request_type_id: number | null
  trigger_hours_overdue: number
  action_type: EscalationActionType
  action_target_staff_id: number | null
  action_target_role: string | null
  escalation_message: string
  created_at: string
  updated_at: string
}

export interface EscalationRulePayload {
  name: string
  is_active?: boolean
  trigger_priority?: number | null
  trigger_request_type_id?: number | null
  trigger_hours_overdue: number
  action_type: EscalationActionType
  action_target_staff_id?: number | null
  action_target_role?: string | null
  escalation_message: string
}

export const getEscalationRules = (): Promise<EscalationRuleAdmin[]> => apiClient.get('/setup/escalation-rules')

export const createEscalationRule = (data: EscalationRulePayload): Promise<EscalationRuleAdmin> =>
  apiClient.post('/setup/escalation-rules', data)

export const updateEscalationRule = (id: number, data: Partial<EscalationRulePayload>): Promise<EscalationRuleAdmin> =>
  apiClient.patch(`/setup/escalation-rules/${id}`, data)

export const runEscalationRulesNow = (): Promise<{ requests_checked: number; rules_fired: number }> =>
  apiClient.post('/setup/escalation-rules/run-now')

export interface RoleAdmin {
  id: number
  key: string
  name: string
}

export const getRoles = (): Promise<RoleAdmin[]> => apiClient.get('/setup/roles')

export interface StaffAdmin {
  id: number
  name: string
  email: string
  is_active: boolean
  created_at: string
  roles: { id: number; key: string; name: string }[]
}

export interface StaffCreatePayload {
  name: string
  email: string
  password: string
  role_ids: number[]
}

export interface StaffUpdatePayload {
  name?: string
  email?: string
  is_active?: boolean
  role_ids?: number[]
}

export const getStaff = (): Promise<StaffAdmin[]> => apiClient.get('/setup/staff')

export const createStaff = (data: StaffCreatePayload): Promise<StaffAdmin> => apiClient.post('/setup/staff', data)

export const updateStaff = (id: number, data: StaffUpdatePayload): Promise<StaffAdmin> =>
  apiClient.patch(`/setup/staff/${id}`, data)
