/**
 * modules/services/service.service.ts
 *
 * Business logic for the Services module.
 * All rules from the PHP reference layer live here, not in the controller.
 *
 * Business rules:
 * - serviceCode must be unique (case-insensitive, stored uppercase).
 * - slug is auto-derived from name if not provided, must be unique.
 * - A service can only be set to 'active' if it has a provider assigned.
 * - Archived services cannot be updated (only admins can un-archive).
 * - isFeatured can only be set by admin/manager roles.
 * - Deleting a service is a soft-archive, not a hard delete (unless admin).
 */

import { AppError } from '../../common/errors/AppError'
import { nextRef } from '../../common/sequence/sequence.service'
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
import { CreateServiceDto, UpdateServiceDto, ServiceListQuery } from './service.types'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function listServices(query: ServiceListQuery) {
  const result = await findServices(query)
  return {
    items: result.items,
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
  return service
}

export async function createNewService(dto: CreateServiceDto, createdBy?: string) {
  // Auto-generate serviceCode if not provided
  const serviceCode = dto.serviceCode?.toUpperCase() ?? (await nextRef('service'))

  // Uniqueness checks
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

  return repoCreate({
    ...dto,
    serviceCode,
    slug,
    status: dto.status ?? 'draft',
    isFeatured: dto.isFeatured ?? false,
    createdBy: createdBy as never,
  })
}

export async function updateExistingService(
  id: string,
  dto: UpdateServiceDto,
  role: string,
) {
  const existing = await findServiceById(id)
  if (!existing) throw AppError.notFound('Service not found.')

  // Business rule: archived services are locked
  if (existing.status === 'archived' && role !== 'admin') {
    throw AppError.forbidden('Archived services cannot be modified. Contact an admin.')
  }

  // Business rule: active requires provider
  const newStatus = dto.status ?? existing.status
  const newProvider = dto.providerId ?? existing.providerId?.toString()
  if (newStatus === 'active' && !newProvider) {
    throw AppError.badRequest('A service cannot be set to active without an assigned provider.')
  }

  // Business rule: only admin/manager can set isFeatured
  if (dto.isFeatured !== undefined && !['admin', 'manager'].includes(role)) {
    throw AppError.forbidden('Only managers and admins can feature a service.')
  }

  // Slug uniqueness if changing
  if (dto.slug && dto.slug !== existing.slug) {
    const conflict = await findServiceBySlug(dto.slug)
    if (conflict && conflict._id?.toString() !== id) {
      throw AppError.conflict(`Slug '${dto.slug}' is already in use.`)
    }
  }

  const updated = await repoUpdate(id, dto as never)
  if (!updated) throw AppError.notFound('Service not found.')
  return updated
}

export async function archiveService(id: string, role: string) {
  const existing = await findServiceById(id)
  if (!existing) throw AppError.notFound('Service not found.')

  if (role === 'admin') {
    // Hard delete for admins
    await repoDelete(id)
    return { deleted: true }
  }

  // Soft archive for non-admins
  const updated = await repoUpdate(id, { status: 'archived' } as never)
  return updated
}

export async function getServicesByProvider(providerId: string) {
  return findServicesByProvider(providerId)
}

export async function getServicesUpdatedSince(since: Date) {
  return findServicesUpdatedSince(since)
}
