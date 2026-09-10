/**
 * modules/providers/provider.repository.ts
 *
 * All Prisma data access for the Providers module. No business logic here.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'
import { ProviderListQuery } from './provider.types'

export async function findProviders(query: ProviderListQuery) {
  const { page = 1, limit = 20, search, category, status, verificationStatus, location } = query
  const where: Prisma.ProviderWhereInput = {
    ...(search ? { OR: [{ name: { contains: search } }, { shortDescription: { contains: search } }] } : {}),
    ...(category ? { categories: { array_contains: category } } : {}),
    ...(status ? { status } : {}),
    ...(verificationStatus ? { verificationStatus } : {}),
    ...(location ? { addressCity: { contains: location } } : {}),
  }

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    prisma.provider.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take: limit }),
    prisma.provider.count({ where }),
  ])

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export function findProviderById(id: number) {
  return prisma.provider.findUnique({ where: { id } })
}

export function findProviderByCode(code: string) {
  return prisma.provider.findUnique({ where: { providerCode: code.toUpperCase() } })
}

export function findProviderBySlug(slug: string) {
  return prisma.provider.findUnique({ where: { slug: slug.toLowerCase() } })
}

export function createProvider(data: Prisma.ProviderCreateInput) {
  return prisma.provider.create({ data })
}

export function updateProvider(id: number, data: Prisma.ProviderUpdateInput) {
  return prisma.provider.update({ where: { id }, data })
}

export function deleteProvider(id: number) {
  return prisma.provider.delete({ where: { id } })
}

export function incrementProviderServiceCount(providerId: number, delta: 1 | -1) {
  return prisma.provider.update({ where: { id: providerId }, data: { serviceCount: { increment: delta } } })
}

export function findProvidersUpdatedSince(since: Date) {
  return prisma.provider.findMany({ where: { updatedAt: { gt: since } } })
}
