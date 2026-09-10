/**
 * modules/services/service.types.ts
 */

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

export interface ServiceDuration {
  value: number
  unit: 'minutes' | 'hours' | 'days'
}

export interface ServiceLocation {
  country?: string
  state?: string
  city?: string
  address?: string
}

// ─── Request / Response DTOs ──────────────────────────────────────────────────

export interface CreateServiceDto {
  serviceCode?: string
  name: string
  slug?: string
  categoryId?: string
  categoryName?: string
  shortDescription?: string
  description?: string
  images?: string[]
  providerId?: number
  serviceType?: string
  pricing?: ServicePricing
  duration?: ServiceDuration
  location?: ServiceLocation
  availability?: ServiceAvailability
  eligibility?: string[]
  requiredDocuments?: string[]
  features?: string[]
  termsAndConditions?: string
  status?: 'draft' | 'active' | 'inactive' | 'archived'
  isFeatured?: boolean
}

export type UpdateServiceDto = Partial<CreateServiceDto>

export interface ServiceListQuery {
  page?: number
  limit?: number
  search?: string
  category?: string
  provider?: number
  location?: string
  status?: string
}
