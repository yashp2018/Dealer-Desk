/**
 * modules/services/service.repository.ts
 *
 * All Prisma data access for the Services module. No business logic here.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'
import { ServiceListQuery } from './service.types'

const includeProvider = {
  provider: { select: { id: true, name: true, logo: true, verificationStatus: true, status: true } },
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ServiceInclude

export async function findServices(query: ServiceListQuery) {
  const { page = 1, limit = 20, search, category, provider, status, location } = query
  const where: Prisma.ServiceWhereInput = {
    ...(search ? { OR: [{ name: { contains: search } }, { shortDescription: { contains: search } }] } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(provider ? { providerId: provider } : {}),
    ...(status ? { status } : {}),
    ...(location ? { locationCity: { contains: location } } : {}),
  }

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    prisma.service.findMany({
      where,
      include: includeProvider,
      orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
      skip,
      take: limit,
    }),
    prisma.service.count({ where }),
  ])

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export function findServiceById(id: number) {
  return prisma.service.findUnique({ where: { id }, include: includeProvider })
}

export function findServiceByCode(code: string) {
  return prisma.service.findUnique({ where: { serviceCode: code.toUpperCase() } })
}

export function findServiceBySlug(slug: string) {
  return prisma.service.findUnique({ where: { slug: slug.toLowerCase() } })
}

export function createService(data: Prisma.ServiceCreateInput) {
  return prisma.service.create({ data, include: includeProvider })
}

export function updateService(id: number, data: Prisma.ServiceUpdateInput) {
  return prisma.service.update({ where: { id }, data, include: includeProvider })
}

export function deleteService(id: number) {
  return prisma.service.delete({ where: { id } })
}

export function findServicesByProvider(providerId: number) {
  return prisma.service.findMany({
    where: { providerId },
    select: { id: true, serviceCode: true, name: true, slug: true, status: true, isFeatured: true },
  })
}

export function findServicesUpdatedSince(since: Date) {
  return prisma.service.findMany({ where: { updatedAt: { gt: since } }, include: includeProvider })
}
