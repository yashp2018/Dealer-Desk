/**
 * modules/services/service.service.ts
 *
 * Business logic for the Services module.
 *
 * Business rules:
 * - serviceCode must be unique (case-insensitive, stored uppercase).
 * - slug is auto-derived from name if not provided, must be unique.
 * - A service can only be set to 'active' if it has a provider assigned.
 * - Archived services cannot be updated (only admins can un-archive).
 * - isFeatured can only be set by admin/manager roles.
 * - Deleting a service is a soft-archive, not a hard delete (unless admin).
 */

import { Prisma } from '@prisma/client'
import { AppError } from '../../common/errors/AppError'
import { nextRefNo } from '../../common/utils/sequence'
import {
  findServices,
  findServiceById,
  findServiceByCode,
  findServiceBySlug,
  createService as repoCreate,
  updateService as repoUpdate,
  deleteService as repoDelete,
  findServicesByProvider,
  findServicesUpdatedSince,
} from './service.repository'
import { toServiceDto } from './service.mapper'
import { CreateServiceDto, UpdateServiceDto, ServiceListQuery } from './service.types'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function toCreateData(dto: CreateServiceDto, serviceCode: string, slug: string, createdBy?: number): Prisma.ServiceCreateInput {
  return {
    serviceCode,
    name: dto.name,
    slug,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    shortDescription: dto.shortDescription,
    description: dto.description,
    images: dto.images ?? [],
    provider: dto.providerId ? { connect: { id: dto.providerId } } : undefined,
    serviceType: dto.serviceType,
    pricingType: dto.pricing?.type,
    pricingAmount: dto.pricing?.amount,
    pricingMinAmount: dto.pricing?.minAmount,
    pricingMaxAmount: dto.pricing?.maxAmount,
    pricingCurrency: dto.pricing?.currency,
    durationValue: dto.duration?.value,
    durationUnit: dto.duration?.unit,
    locationCountry: dto.location?.country,
    locationState: dto.location?.state,
    locationCity: dto.location?.city,
    locationAddress: dto.location?.address,
    availabilityEnabled: dto.availability?.enabled ?? true,
    availabilityDays: dto.availability?.days ?? [],
    availabilityStart: dto.availability?.startTime,
    availabilityEnd: dto.availability?.endTime,
    eligibility: dto.eligibility ?? [],
    requiredDocuments: dto.requiredDocuments ?? [],
    features: dto.features ?? [],
    termsAndConditions: dto.termsAndConditions,
    status: dto.status ?? 'draft',
    isFeatured: dto.isFeatured ?? false,
    creator: createdBy ? { connect: { id: createdBy } } : undefined,
  }
}

function toUpdateData(dto: UpdateServiceDto, slug?: string): Prisma.ServiceUpdateInput {
  return {
    ...(dto.name !== undefined ? { name: dto.name } : {}),
    ...(slug !== undefined ? { slug } : {}),
    ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
    ...(dto.categoryName !== undefined ? { categoryName: dto.categoryName } : {}),
    ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}),
    ...(dto.description !== undefined ? { description: dto.description } : {}),
    ...(dto.images !== undefined ? { images: dto.images } : {}),
    ...(dto.providerId !== undefined ? { provider: dto.providerId ? { connect: { id: dto.providerId } } : { disconnect: true } } : {}),
    ...(dto.serviceType !== undefined ? { serviceType: dto.serviceType } : {}),
    ...(dto.pricing !== undefined
      ? {
          pricingType: dto.pricing.type,
          pricingAmount: dto.pricing.amount,
          pricingMinAmount: dto.pricing.minAmount,
          pricingMaxAmount: dto.pricing.maxAmount,
          pricingCurrency: dto.pricing.currency,
        }
      : {}),
    ...(dto.duration !== undefined ? { durationValue: dto.duration.value, durationUnit: dto.duration.unit } : {}),
    ...(dto.location !== undefined
      ? {
          locationCountry: dto.location.country,
          locationState: dto.location.state,
          locationCity: dto.location.city,
          locationAddress: dto.location.address,
        }
      : {}),
    ...(dto.availability !== undefined
      ? {
          availabilityEnabled: dto.availability.enabled,
          availabilityDays: dto.availability.days,
          availabilityStart: dto.availability.startTime,
          availabilityEnd: dto.availability.endTime,
        }
      : {}),
    ...(dto.eligibility !== undefined ? { eligibility: dto.eligibility } : {}),
    ...(dto.requiredDocuments !== undefined ? { requiredDocuments: dto.requiredDocuments } : {}),
    ...(dto.features !== undefined ? { features: dto.features } : {}),
    ...(dto.termsAndConditions !== undefined ? { termsAndConditions: dto.termsAndConditions } : {}),
    ...(dto.status !== undefined ? { status: dto.status } : {}),
    ...(dto.isFeatured !== undefined ? { isFeatured: dto.isFeatured } : {}),
  }
}

export async function listServices(query: ServiceListQuery) {
  const result = await findServices(query)
  return {
    items: result.items.map(toServiceDto),
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  }
}

export async function getService(id: number) {
  const service = await findServiceById(id)
  if (!service) throw AppError.notFound('Service not found.')
  return toServiceDto(service)
}

export async function createNewService(dto: CreateServiceDto, createdBy?: number) {
  const serviceCode = dto.serviceCode?.toUpperCase() ?? (await nextRefNo('SVC'))

  const [codeConflict, slugConflict] = await Promise.all([
    findServiceByCode(serviceCode),
    findServiceBySlug(dto.slug ?? toSlug(dto.name)),
  ])

  if (codeConflict) throw AppError.conflict(`Service code '${serviceCode}' is already in use.`)

  const slug = dto.slug ?? toSlug(dto.name)
  if (slugConflict) throw AppError.conflict(`Slug '${slug}' is already in use.`)

  // Business rule: active status requires a provider
  if (dto.status === 'active' && !dto.providerId) {
    throw AppError.badRequest('A service cannot be set to active without an assigned provider.')
  }

  const created = await repoCreate(toCreateData(dto, serviceCode, slug, createdBy))
  return toServiceDto(created)
}

export async function updateExistingService(id: number, dto: UpdateServiceDto, role: string) {
  const existing = await findServiceById(id)
  if (!existing) throw AppError.notFound('Service not found.')

  // Business rule: archived services are locked
  if (existing.status === 'archived' && role !== 'admin') {
    throw AppError.forbidden('Archived services cannot be modified. Contact an admin.')
  }

  // Business rule: active requires provider
  const newStatus = dto.status ?? existing.status
  const newProvider = dto.providerId ?? existing.providerId ?? undefined
  if (newStatus === 'active' && !newProvider) {
    throw AppError.badRequest('A service cannot be set to active without an assigned provider.')
  }

  // Business rule: only admin/manager can set isFeatured
  if (dto.isFeatured !== undefined && !['admin', 'manager'].includes(role)) {
    throw AppError.forbidden('Only managers and admins can feature a service.')
  }

  // Slug uniqueness if changing
  let slug: string | undefined
  if (dto.slug && dto.slug !== existing.slug) {
    const conflict = await findServiceBySlug(dto.slug)
    if (conflict && conflict.id !== id) {
      throw AppError.conflict(`Slug '${dto.slug}' is already in use.`)
    }
    slug = dto.slug
  }

  const updated = await repoUpdate(id, toUpdateData(dto, slug))
  return toServiceDto(updated)
}

export async function archiveService(id: number, role: string) {
  const existing = await findServiceById(id)
  if (!existing) throw AppError.notFound('Service not found.')

  if (role === 'admin') {
    // Hard delete for admins
    await repoDelete(id)
    return { deleted: true }
  }

  // Soft archive for non-admins
  const updated = await repoUpdate(id, { status: 'archived' })
  return toServiceDto(updated)
}

export async function getServicesByProvider(providerId: number) {
  return findServicesByProvider(providerId)
}

export async function getServicesUpdatedSince(since: Date) {
  return (await findServicesUpdatedSince(since)).map(toServiceDto)
}
