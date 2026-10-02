/**
 * modules/providers/provider.service.ts
 *
 * Business logic for the Providers module.
 */

import { Prisma } from '@prisma/client'
import { AppError } from '../../common/errors/AppError'
import { nextRefNo } from '../../common/utils/sequence'
import {
  findProviders,
  findProviderById,
  findProviderByCode,
  findProviderBySlug,
  createProvider as repoCreate,
  updateProvider as repoUpdate,
  deleteProvider as repoDelete,
  incrementProviderServiceCount,
  findProvidersUpdatedSince,
} from './provider.repository'
import { findServicesByProvider } from '../services/service.repository'
import { toProviderDto } from './provider.mapper'
import { CreateProviderDto, UpdateProviderDto, ProviderListQuery } from './provider.types'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function toCreateData(dto: CreateProviderDto, providerCode: string, slug: string, createdBy?: string): Prisma.ProviderCreateInput {
  return {
    providerCode,
    name: dto.name,
    slug,
    logo: dto.logo,
    coverImage: dto.coverImage,
    shortDescription: dto.shortDescription,
    description: dto.description,
    contactPhone: dto.contact?.phone,
    contactEmail: dto.contact?.email,
    contactWebsite: dto.contact?.website,
    addressCountry: dto.address?.country,
    addressState: dto.address?.state,
    addressCity: dto.address?.city,
    addressLine: dto.address?.address,
    addressPostalCode: dto.address?.postalCode,
    categories: dto.categories ?? [],
    verificationStatus: dto.verificationStatus ?? 'pending',
    status: dto.status ?? 'active',
    serviceCount: 0,
    creator: createdBy ? { connect: { id: createdBy } } : undefined,
  }
}

function toUpdateData(dto: UpdateProviderDto, slug?: string): Prisma.ProviderUpdateInput {
  return {
    ...(dto.name !== undefined ? { name: dto.name } : {}),
    ...(slug !== undefined ? { slug } : {}),
    ...(dto.logo !== undefined ? { logo: dto.logo } : {}),
    ...(dto.coverImage !== undefined ? { coverImage: dto.coverImage } : {}),
    ...(dto.shortDescription !== undefined ? { shortDescription: dto.shortDescription } : {}),
    ...(dto.description !== undefined ? { description: dto.description } : {}),
    ...(dto.contact !== undefined
      ? { contactPhone: dto.contact.phone, contactEmail: dto.contact.email, contactWebsite: dto.contact.website }
      : {}),
    ...(dto.address !== undefined
      ? {
          addressCountry: dto.address.country,
          addressState: dto.address.state,
          addressCity: dto.address.city,
          addressLine: dto.address.address,
          addressPostalCode: dto.address.postalCode,
        }
      : {}),
    ...(dto.categories !== undefined ? { categories: dto.categories } : {}),
    ...(dto.verificationStatus !== undefined ? { verificationStatus: dto.verificationStatus } : {}),
    ...(dto.status !== undefined ? { status: dto.status } : {}),
  }
}

export async function listProviders(query: ProviderListQuery) {
  const result = await findProviders(query)
  return {
    items: result.items.map(toProviderDto),
    meta: {
      page: result.page,
      limit: result.limit,
      total: result.total,
      totalPages: result.totalPages,
    },
  }
}

export async function getProvider(id: string) {
  const provider = await findProviderById(id)
  if (!provider) throw AppError.notFound('Provider not found.')
  return toProviderDto(provider)
}

export async function createNewProvider(dto: CreateProviderDto, createdBy?: string) {
  const providerCode = dto.providerCode?.toUpperCase() ?? (await nextRefNo('PRV'))

  const [codeConflict, slugConflict] = await Promise.all([
    findProviderByCode(providerCode),
    findProviderBySlug(dto.slug ?? toSlug(dto.name)),
  ])

  if (codeConflict) throw AppError.conflict(`Provider code '${providerCode}' is already in use.`)

  const slug = dto.slug ?? toSlug(dto.name)
  if (slugConflict) throw AppError.conflict(`Slug '${slug}' is already in use.`)

  const created = await repoCreate(toCreateData(dto, providerCode, slug, createdBy))
  return toProviderDto(created)
}

export async function updateExistingProvider(id: string, dto: UpdateProviderDto, role: string) {
  const existing = await findProviderById(id)
  if (!existing) throw AppError.notFound('Provider not found.')

  if (dto.verificationStatus !== undefined && !['admin', 'manager'].includes(role)) {
    throw AppError.forbidden('Only managers and admins can change verification status.')
  }

  let slug: string | undefined
  if (dto.slug && dto.slug !== existing.slug) {
    const conflict = await findProviderBySlug(dto.slug)
    if (conflict && conflict.id !== id) {
      throw AppError.conflict(`Slug '${dto.slug}' is already in use.`)
    }
    slug = dto.slug
  }

  const updated = await repoUpdate(id, toUpdateData(dto, slug))
  return toProviderDto(updated)
}

export async function removeProvider(id: string, role: string) {
  const existing = await findProviderById(id)
  if (!existing) throw AppError.notFound('Provider not found.')

  const services = await findServicesByProvider(id)
  const activeServices = services.filter((s) => s.status === 'active')

  if (activeServices.length > 0 && role !== 'admin') {
    throw AppError.badRequest(
      `Cannot delete provider with ${activeServices.length} active service(s). Archive the services first.`,
    )
  }

  await repoDelete(id)
  return { deleted: true }
}

export async function getProviderServices(providerId: string) {
  const provider = await findProviderById(providerId)
  if (!provider) throw AppError.notFound('Provider not found.')
  return findServicesByProvider(providerId)
}

export async function adjustProviderServiceCount(providerId: string, delta: 1 | -1) {
  return incrementProviderServiceCount(providerId, delta)
}

export async function getProvidersUpdatedSince(since: Date) {
  return (await findProvidersUpdatedSince(since)).map(toProviderDto)
}
