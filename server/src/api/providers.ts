import apiClient from './client'

export interface Provider {
  id: string
  providerCode: string
  name: string
  slug: string

  logo?: string
  coverImage?: string

  shortDescription?: string
  description?: string

  contact?: {
    phone?: string
    email?: string
    website?: string
  }

  address?: {
    country?: string
    state?: string
    city?: string
    address?: string
    postalCode?: string
  }

  categories?: string[]

  verificationStatus:
    | 'pending'
    | 'verified'
    | 'rejected'
    | 'inactive'

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
}

export async function getProviders(
  params?: ProviderListParams,
): Promise<{ items: Provider[]; meta?: Record<string, unknown> }> {
  const response = await apiClient.get('/providers', { params })

  if (Array.isArray(response)) {
    return { items: response as Provider[] }
  }

  return response
}

export async function getProvider(id: string): Promise<Provider> {
  return apiClient.get(`/providers/${id}`)
}

export async function getProviderServices(
  id: string,
) {
  return apiClient.get(`/providers/${id}/services`)
}

export async function createProvider(payload: Partial<Provider>) {
  return apiClient.post('/providers', payload)
}

export async function updateProvider(
  id: string,
  payload: Partial<Provider>,
) {
  return apiClient.patch(`/providers/${id}`, payload)
} 