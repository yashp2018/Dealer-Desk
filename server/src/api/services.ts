import apiClient from './client'

export interface ServicePricing {
  type: 'free' | 'fixed' | 'range' | 'quote'
  amount?: number
  minAmount?: number
  maxAmount?: number
  currency?: string
}

export interface ServiceAvailability {
  enabled: boolean
  days: string[]
  startTime?: string
  endTime?: string
}

export interface ServiceProvider {
  id: string
  name: string
  logo?: string
  verificationStatus?: string
}

export interface ServiceItem {
  id: string
  serviceCode: string
  name: string
  slug: string

  categoryId?: string
  categoryName?: string

  shortDescription?: string
  description?: string

  images?: string[]

  providerId?: string
  provider?: ServiceProvider

  serviceType?: string

  pricing?: ServicePricing

  duration?: {
    value: number
    unit: string
  }

  location?: {
    country?: string
    state?: string
    city?: string
    address?: string
  }

  availability?: ServiceAvailability

  eligibility?: string[]
  requiredDocuments?: string[]
  features?: string[]

  termsAndConditions?: string

  status: 'draft' | 'active' | 'inactive' | 'archived'

  isFeatured?: boolean

  createdAt?: string
  updatedAt?: string
}

export interface ServiceListParams {
  page?: number
  limit?: number
  search?: string
  category?: string
  provider?: string
  location?: string
  status?: string
}

export interface ServiceListResponse {
  items: ServiceItem[]
  meta?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateServicePayload {
  serviceCode: string
  name: string
  slug: string
  categoryId?: string
  categoryName?: string
  shortDescription?: string
  description?: string
  providerId?: string
  serviceType?: string
  pricing?: ServicePricing
  duration?: {
    value: number
    unit: string
  }
  location?: ServiceItem['location']
  availability?: ServiceAvailability
  eligibility?: string[]
  requiredDocuments?: string[]
  features?: string[]
  termsAndConditions?: string
  status?: ServiceItem['status']
  isFeatured?: boolean
}

export async function getServices(
  params?: ServiceListParams,
): Promise<ServiceListResponse> {
  const response = await apiClient.get('/services', { params })

  if (Array.isArray(response)) {
    return {
      items: response as ServiceItem[],
    }
  }

  return response as ServiceListResponse
}

export async function getService(id: string): Promise<ServiceItem> {
  return apiClient.get(`/services/${id}`)
}

export async function createService(
  payload: CreateServicePayload,
): Promise<ServiceItem> {
  return apiClient.post('/services', payload)
}

export async function updateService(
  id: string,
  payload: Partial<CreateServicePayload>,
): Promise<ServiceItem> {
  return apiClient.patch(`/services/${id}`, payload)
}

export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`/services/${id}`)
}