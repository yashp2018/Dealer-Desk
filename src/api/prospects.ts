import apiClient from './client'
import type { Prospect, OnboardingItem, Request, Visit } from './types'
import { mockProspects, mockRequests, mockVisits } from './mockData'

const MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const getProspects = (): Promise<Prospect[]> =>
  MOCK ? Promise.resolve(mockProspects as unknown as Prospect[]) : apiClient.get('/prospects')

export const getProspect = (id: number): Promise<Prospect> =>
  MOCK ? Promise.resolve(mockProspects.find((p) => p.id === id) as unknown as Prospect) : apiClient.get(`/prospects/${id}`)

export const setProspectStage = (id: number, stage: string): Promise<Prospect> =>
  MOCK ? Promise.resolve({ ...mockProspects.find((p) => p.id === id), stage } as unknown as Prospect) : apiClient.post(`/prospects/${id}/stage`, { stage })

export const convertProspect = (id: number, tier_id?: number): Promise<{ converted: boolean; dealer_id: number }> =>
  MOCK ? Promise.resolve({ converted: true, dealer_id: 99 }) : apiClient.post(`/prospects/${id}/convert`, { tier_id })

export const getProspectChecklist = (_id: number): Promise<OnboardingItem[]> =>
  MOCK ? Promise.resolve([]) : apiClient.get(`/prospects/${_id}/checklist`)

export const setOnboardingItem = (id: number, item_id: number, status: string): Promise<OnboardingItem> =>
  MOCK ? Promise.resolve({ id: item_id, doc_name: '', is_required: false, status: status as OnboardingItem['status'] }) : apiClient.post(`/prospects/${id}/checklist/${item_id}`, { status })

export const getProspectVisits = (id: number): Promise<Visit[]> =>
  MOCK ? Promise.resolve(mockVisits as unknown as Visit[]) : apiClient.get(`/prospects/${id}/visits`)

export const getProspectRequests = (id: number): Promise<Request[]> =>
  MOCK ? Promise.resolve(mockRequests as Request[]) : apiClient.get(`/prospects/${id}/requests`)
