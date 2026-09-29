import { Service, Provider, ServiceCategory, Prisma } from '@prisma/client'

type ServiceWithProvider = Service & {
  provider?: Pick<Provider, 'id' | 'name' | 'logo' | 'verificationStatus' | 'status'> | null
  category?: Pick<ServiceCategory, 'id' | 'name' | 'slug'> | null
}

function asStringArray(json: Prisma.JsonValue): string[] {
  return Array.isArray(json) ? (json as string[]) : []
}

export function toServiceDto(s: ServiceWithProvider) {
  return {
    id: s.id,
    serviceCode: s.serviceCode,
    name: s.name,
    slug: s.slug,
    categoryId: s.categoryId ?? undefined,
    category: s.category ? { id: s.category.id, name: s.category.name, slug: s.category.slug } : undefined,
    shortDescription: s.shortDescription ?? undefined,
    description: s.description ?? undefined,
    images: asStringArray(s.images),
    providerId: s.providerId,
    provider: s.provider
      ? { id: s.provider.id, name: s.provider.name, logo: s.provider.logo ?? undefined, verificationStatus: s.provider.verificationStatus }
      : undefined,
    serviceType: s.serviceType ?? undefined,
    pricing: s.pricingType
      ? {
          type: s.pricingType,
          amount: s.pricingAmount ?? undefined,
          minAmount: s.pricingMinAmount ?? undefined,
          maxAmount: s.pricingMaxAmount ?? undefined,
          currency: s.pricingCurrency ?? undefined,
        }
      : undefined,
    duration: s.durationValue != null ? { value: s.durationValue, unit: s.durationUnit } : undefined,
    location: {
      country: s.locationCountry ?? undefined,
      state: s.locationState ?? undefined,
      city: s.locationCity ?? undefined,
      address: s.locationAddress ?? undefined,
    },
    availability: {
      enabled: s.availabilityEnabled,
      days: asStringArray(s.availabilityDays),
      startTime: s.availabilityStart ?? undefined,
      endTime: s.availabilityEnd ?? undefined,
    },
    eligibility: asStringArray(s.eligibility),
    requiredDocuments: asStringArray(s.requiredDocuments),
    features: asStringArray(s.features),
    termsAndConditions: s.termsAndConditions ?? undefined,
    status: s.status,
    isFeatured: s.isFeatured,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }
}
