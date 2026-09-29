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
  id: number
  serviceCode: string
  name: string
  slug: string
  categoryId?: number
  category?: { id: number; name: string; slug: string }
  shortDescription?: string
  description?: string
  images?: string[]
  providerId?: number
  provider?: { id: number; name: string; logo?: string; verificationStatus?: string }
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
  category?: number
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

export type CreateServicePayload = Omit<ServiceItem, 'id' | 'createdAt' | 'updatedAt' | 'provider' | 'category'>

export async function getServices(params?: ServiceListParams): Promise<ServiceItem[]> {
  return apiClient.get('/services', { params })
}

export async function getService(id: number): Promise<ServiceItem> {
  return apiClient.get(`/services/${id}`)
}

export async function createService(payload: CreateServicePayload): Promise<ServiceItem> {
  return apiClient.post('/services', payload)
}

export async function updateService(id: number, payload: Partial<CreateServicePayload>): Promise<ServiceItem> {
  return apiClient.patch(`/services/${id}`, payload)
}

export async function deleteService(id: number): Promise<void> {
  await apiClient.delete(`/services/${id}`)
}
