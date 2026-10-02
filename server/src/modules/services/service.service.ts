/**
 * modules/services/service.service.ts
 *
 * Business logic for the Services module.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'
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

async function assertCategoryExists(categoryId: string) {
  const category = await prisma.serviceCategory.findUnique({ where: { id: categoryId } })
  if (!category) throw AppError.badRequest('Unknown service category.')
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function toCreateData(dto: CreateServiceDto, serviceCode: string, slug: string, createdBy?: string): Prisma.ServiceCreateInput {
  return {
    serviceCode,
    name: dto.name,
    slug,
    category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,
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
    ...(dto.categoryId !== undefined ? { category: dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true } } : {}),
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

export async function getService(id: string) {
  const service = await findServiceById(id)
  if (!service) throw AppError.notFound('Service not found.')
  return toServiceDto(service)
}

export async function createNewService(dto: CreateServiceDto, createdBy?: string) {
  const serviceCode = dto.serviceCode?.toUpperCase() ?? (await nextRefNo('SVC'))

  const [codeConflict, slugConflict] = await Promise.all([
    findServiceByCode(serviceCode),
    findServiceBySlug(dto.slug ?? toSlug(dto.name)),
  ])

  if (codeConflict) throw AppError.conflict(`Service code '${serviceCode}' is already in use.`)

  const slug = dto.slug ?? toSlug(dto.name)
  if (slugConflict) throw AppError.conflict(`Slug '${slug}' is already in use.`)

  if (dto.status === 'active' && !dto.providerId) {
    throw AppError.badRequest('A service cannot be set to active without an assigned provider.')
  }

  if (dto.categoryId) await assertCategoryExists(dto.categoryId)

  const created = await repoCreate(toCreateData(dto, serviceCode, slug, createdBy))
  return toServiceDto(created)
}

export async function updateExistingService(id: string, dto: UpdateServiceDto, role: string) {
  const existing = await findServiceById(id)
  if (!existing) throw AppError.notFound('Service not found.')

  if (existing.status === 'archived' && role !== 'admin') {
    throw AppError.forbidden('Archived services cannot be modified. Contact an admin.')
  }

  const newStatus = dto.status ?? existing.status
  const newProvider = dto.providerId ?? existing.providerId ?? undefined
  if (newStatus === 'active' && !newProvider) {
    throw AppError.badRequest('A service cannot be set to active without an assigned provider.')
  }

  if (dto.isFeatured !== undefined && !['admin', 'manager'].includes(role)) {
    throw AppError.forbidden('Only managers and admins can feature a service.')
  }

  let slug: string | undefined
  if (dto.slug && dto.slug !== existing.slug) {
    const conflict = await findServiceBySlug(dto.slug)
    if (conflict && conflict.id !== id) {
      throw AppError.conflict(`Slug '${dto.slug}' is already in use.`)
    }
    slug = dto.slug
  }

  if (dto.categoryId) await assertCategoryExists(dto.categoryId)

  const updated = await repoUpdate(id, toUpdateData(dto, slug))
  return toServiceDto(updated)
}

export async function archiveService(id: string, role: string) {
  const existing = await findServiceById(id)
  if (!existing) throw AppError.notFound('Service not found.')

  if (role === 'admin') {
    await repoDelete(id)
    return { deleted: true }
  }

  const updated = await repoUpdate(id, { status: 'archived' })
  return toServiceDto(updated)
}

export async function getServicesByProvider(providerId: string) {
  return findServicesByProvider(providerId)
}

export async function getServicesUpdatedSince(since: Date) {
  return (await findServicesUpdatedSince(since)).map(toServiceDto)
}
