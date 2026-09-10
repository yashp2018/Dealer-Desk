/**
 * src/api/services.ts
 *
 * Frontend API client for the Services module.
 * Consumes the Express /api/v1/services endpoints.
 */

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

export interface ServiceItem {
  _id: string
  serviceCode: string
  name: string
  slug: string
  categoryId?: string
  categoryName?: string
  shortDescription?: string
  description?: string
  images?: string[]
  providerId?: string
  provider?: { _id: string; name: string; logo?: string; verificationStatus?: string }
  serviceType?: string
  pricing?: ServicePricing
  duration?: { value: number; unit: string }
  location?: { country?: string; state?: string; city?: string; address?: string }
  availability?: ServiceAvailability
  eligibility?: string[]
  requiredDocuments?: string[]
  features?: string[]
  termsAndConditions?: string
  status: 'draft' | 'active' | 'inactive' | 'archived'
  isFeatured: boolean
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

export interface ServiceListMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type CreateServicePayload = Omit<ServiceItem, '_id' | 'createdAt' | 'updatedAt' | 'provider'>

export async function getServices(params?: ServiceListParams): Promise<{ items: ServiceItem[]; meta?: ServiceListMeta }> {
  const response = await apiClient.get('/services', { params }) as ServiceItem[] | { items: ServiceItem[]; meta?: ServiceListMeta }
  if (Array.isArray(response)) return { items: response }
  return response
}

export async function getService(id: string): Promise<ServiceItem> {
  return apiClient.get(`/services/${id}`)
}

export async function createService(payload: CreateServicePayload): Promise<ServiceItem> {
  return apiClient.post('/services', payload)
}

export async function updateService(id: string, payload: Partial<CreateServicePayload>): Promise<ServiceItem> {
  return apiClient.patch(`/services/${id}`, payload)
}

export async function deleteService(id: string): Promise<void> {
  await apiClient.delete(`/services/${id}`)
}
