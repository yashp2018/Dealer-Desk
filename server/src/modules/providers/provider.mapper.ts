import { Provider, Prisma } from '@prisma/client'

function asStringArray(json: Prisma.JsonValue): string[] {
  return Array.isArray(json) ? (json as string[]) : []
}

export function toProviderDto(p: Provider) {
  return {
    id: p.id,
    providerCode: p.providerCode,
    name: p.name,
    slug: p.slug,
    logo: p.logo ?? undefined,
    coverImage: p.coverImage ?? undefined,
    shortDescription: p.shortDescription ?? undefined,
    description: p.description ?? undefined,
    contact: {
      phone: p.contactPhone ?? undefined,
      email: p.contactEmail ?? undefined,
      website: p.contactWebsite ?? undefined,
    },
    address: {
      country: p.addressCountry ?? undefined,
      state: p.addressState ?? undefined,
      city: p.addressCity ?? undefined,
      address: p.addressLine ?? undefined,
      postalCode: p.addressPostalCode ?? undefined,
    },
    categories: asStringArray(p.categories),
    verificationStatus: p.verificationStatus,
    status: p.status,
    serviceCount: p.serviceCount,
    rating: p.rating ?? undefined,
    reviewCount: p.reviewCount,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }
}
