import apiClient from './client'
import type { Prospect, OnboardingItem, Request, Visit, CreateProspectPayload } from './types'

export const getProspects = (): Promise<Prospect[]> =>
  apiClient.get('/prospects')

export const getProspect = (id: number): Promise<Prospect> =>
  apiClient.get(`/prospects/${id}`)

export const createProspect = (data: CreateProspectPayload): Promise<Prospect> =>
  apiClient.post('/prospects', data)

export const setProspectStage = (id: number, stage: string): Promise<Prospect> =>
  apiClient.post(`/prospects/${id}/stage`, { stage })

export const convertProspect = (id: number, tier_id?: number): Promise<{ converted: boolean; dealer_id: number }> =>
  apiClient.post(`/prospects/${id}/convert`, { tier_id })

export const getProspectChecklist = (id: number): Promise<OnboardingItem[]> =>
  apiClient.get(`/prospects/${id}/checklist`)

export const setOnboardingItem = (id: number, item_id: number, status: string): Promise<OnboardingItem> =>
  apiClient.post(`/prospects/${id}/checklist/${item_id}`, { status })

export const getProspectVisits = (id: number): Promise<Visit[]> =>
  apiClient.get(`/prospects/${id}/visits`)

export const getProspectRequests = (id: number): Promise<Request[]> =>
  apiClient.get(`/prospects/${id}/requests`)
