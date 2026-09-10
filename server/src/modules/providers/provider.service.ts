/**
 * modules/providers/provider.service.ts
 *
 * Business logic for the Providers module.
 *
 * Business rules (from Dd_base_service.php / Dd_permission_service.php):
 * - providerCode must be unique (case-insensitive, stored uppercase).
 * - slug is auto-derived from name if not provided, must be unique.
 * - Only admin/manager can change verificationStatus.
 * - A provider with status 'inactive' cannot have active services
 *   (enforced at service creation, not here — but we expose a helper).
 * - serviceCount is maintained atomically via the repository.
 * - Deleting a provider is blocked if it has active services (admin can force).
 */

import { AppError } from '../../common/errors/AppError'
import { nextRef } from '../../common/sequence/sequence.service'
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
import { CreateProviderDto, UpdateProviderDto, ProviderListQuery } from './provider.types'

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function listProviders(query: ProviderListQuery) {
  const result = await findProviders(query)
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

export async function getProvider(id: string) {
  const provider = await findProviderById(id)
  if (!provider) throw AppError.notFound('Provider not found.')
  return provider
}

export async function createNewProvider(dto: CreateProviderDto, createdBy?: string) {
  const providerCode = dto.providerCode?.toUpperCase() ?? (await nextRef('provider'))

  const [codeConflict, slugConflict] = await Promise.all([
    findProviderByCode(providerCode),
    findProviderBySlug(dto.slug ?? toSlug(dto.name)),
  ])

  if (codeConflict) throw AppError.conflict(`Provider code '${providerCode}' is already in use.`)

  const slug = dto.slug ?? toSlug(dto.name)
  if (slugConflict) throw AppError.conflict(`Slug '${slug}' is already in use.`)

  return repoCreate({
    ...dto,
    providerCode,
    slug,
    verificationStatus: dto.verificationStatus ?? 'pending',
    status: dto.status ?? 'active',
    serviceCount: 0,
    createdBy: createdBy as never,
  })
}

export async function updateExistingProvider(
  id: string,
  dto: UpdateProviderDto,
  role: string,
) {
  const existing = await findProviderById(id)
  if (!existing) throw AppError.notFound('Provider not found.')

  // Business rule: only admin/manager can change verificationStatus
  if (dto.verificationStatus !== undefined && !['admin', 'manager'].includes(role)) {
    throw AppError.forbidden('Only managers and admins can change verification status.')
  }

  // Slug uniqueness if changing
  if (dto.slug && dto.slug !== existing.slug) {
    const conflict = await findProviderBySlug(dto.slug)
    if (conflict && conflict._id?.toString() !== id) {
      throw AppError.conflict(`Slug '${dto.slug}' is already in use.`)
    }
  }

  const updated = await repoUpdate(id, dto as never)
  if (!updated) throw AppError.notFound('Provider not found.')
  return updated
}

export async function removeProvider(id: string, role: string) {
  const existing = await findProviderById(id)
  if (!existing) throw AppError.notFound('Provider not found.')

  // Business rule: block deletion if provider has active services
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
  return findProvidersUpdatedSince(since)
}
