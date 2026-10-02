import apiClient from './client'
import type { ServiceItem } from './services'

export interface Provider {
  id: string
  providerCode: string
  name: string
  slug: string
  logo?: string
  coverImage?: string
  shortDescription?: string
  description?: string
  contact?: { phone?: string; email?: string; website?: string }
  address?: { country?: string; state?: string; city?: string; address?: string; postalCode?: string }
  categories?: string[]
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'inactive'
  status: 'active' | 'inactive'
  serviceCount?: number
  rating?: number
  reviewCount?: number
  createdAt?: string
  updatedAt?: string
}

export interface ProviderListParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  location?: string
  status?: string
  verificationStatus?: string
}

export type CreateProviderPayload = Omit<Provider, 'id' | 'serviceCount' | 'rating' | 'reviewCount' | 'createdAt' | 'updatedAt'>

export async function getProviders(params?: ProviderListParams): Promise<Provider[]> {
  return apiClient.get('/providers', { params })
}

export async function getProvider(id: string): Promise<Provider> {
  return apiClient.get(`/providers/${id}`)
}

export async function getProviderServices(id: string): Promise<ServiceItem[]> {
  return apiClient.get(`/providers/${id}/services`)
}

export async function createProvider(payload: Partial<CreateProviderPayload>): Promise<Provider> {
  return apiClient.post('/providers', payload)
}

export async function updateProvider(id: string, payload: Partial<Provider>): Promise<Provider> {
  return apiClient.patch(`/providers/${id}`, payload)
}

export async function deleteProvider(id: string): Promise<void> {
  await apiClient.delete(`/providers/${id}`)
}
