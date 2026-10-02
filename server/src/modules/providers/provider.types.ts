/**
 * modules/providers/provider.types.ts
 */

export interface ProviderContact {
  phone?: string
  email?: string
  website?: string
}

export interface ProviderAddress {
  country?: string
  state?: string
  city?: string
  address?: string
  postalCode?: string
}

export interface CreateProviderDto {
  providerCode?: string
  name: string
  slug?: string
  logo?: string
  coverImage?: string
  shortDescription?: string
  description?: string
  contact?: ProviderContact
  address?: ProviderAddress
  categories?: string[]
  verificationStatus?: 'pending' | 'verified' | 'rejected' | 'inactive'
  status?: 'active' | 'inactive'
}

export type UpdateProviderDto = Partial<CreateProviderDto>

export interface ProviderListQuery {
  page?: number
  limit?: number
  search?: string
  location?: string
  status?: string
  verificationStatus?: string
}
