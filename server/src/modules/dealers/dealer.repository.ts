import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'

const OPEN_STATUSES_NOT_IN = ['done', 'cancelled']

async function withRequestCounts<T extends { id: number }>(dealers: T[]) {
  if (dealers.length === 0) return []
  const ids = dealers.map((d) => d.id)
  const now = new Date()

  const [openCounts, overdueCounts] = await Promise.all([
    prisma.request.groupBy({
      by: ['dealerId'],
      where: { dealerId: { in: ids }, status: { notIn: OPEN_STATUSES_NOT_IN } },
      _count: { _all: true },
    }),
    prisma.request.groupBy({
      by: ['dealerId'],
      where: { dealerId: { in: ids }, status: { notIn: OPEN_STATUSES_NOT_IN }, dueAt: { lt: now } },
      _count: { _all: true },
    }),
  ])

  const openMap = new Map(openCounts.map((c) => [c.dealerId, c._count._all]))
  const overdueMap = new Map(overdueCounts.map((c) => [c.dealerId, c._count._all]))

  return dealers.map((d) => ({
    ...d,
    _openRequests: openMap.get(d.id) ?? 0,
    _overdueRequests: overdueMap.get(d.id) ?? 0,
  }))
}

export const dealerRepository = {
  async findMany(params: {
    skip: number
    take: number
    q?: string
    territoryId?: number
    tierId?: number
    ownerStaffId?: number
    health?: string
  }) {
    const where: Prisma.DealerWhereInput = {
      ...(params.q
        ? {
            OR: [
              { name: { contains: params.q } },
              { code: { contains: params.q } },
              { city: { contains: params.q } },
            ],
          }
        : {}),
      ...(params.territoryId ? { territoryId: params.territoryId } : {}),
      ...(params.tierId ? { tierId: params.tierId } : {}),
      ...(params.ownerStaffId ? { ownerStaffId: params.ownerStaffId } : {}),
      ...(params.health ? { health: params.health } : {}),
    }

    const [dealers, total] = await Promise.all([
      prisma.dealer.findMany({
        where,
        include: { tier: true, territory: true },
        orderBy: { name: 'asc' },
        skip: params.skip,
        take: params.take,
      }),
      prisma.dealer.count({ where }),
    ])

    return { dealers: await withRequestCounts(dealers), total }
  },

  async findById(id: number) {
    const dealer = await prisma.dealer.findUnique({ where: { id }, include: { tier: true, territory: true } })
    if (!dealer) return null
    const [withCounts] = await withRequestCounts([dealer])
    return withCounts
  },

  create(data: Prisma.DealerCreateInput) {
    return prisma.dealer.create({ data, include: { tier: true, territory: true } })
  },

  findByName(name: string) {
    return prisma.dealer.findFirst({ where: { name } })
  },

  update(id: number, data: Prisma.DealerUpdateInput) {
    return prisma.dealer.update({ where: { id }, data, include: { tier: true, territory: true } })
  },

  contacts(dealerId: number) {
    return prisma.dealerContact.findMany({
      where: { dealerId, isActive: true },
      orderBy: [{ isPrimary: 'desc' }, { name: 'asc' }],
    })
  },

  async addContact(dealerId: number, data: { name: string; roleLabel?: string; phone?: string; email?: string; isPrimary?: boolean }) {
    if (data.isPrimary) {
      await prisma.dealerContact.updateMany({ where: { dealerId, isPrimary: true }, data: { isPrimary: false } })
    }
    return prisma.dealerContact.create({
      data: {
        dealerId,
        name: data.name,
        roleLabel: data.roleLabel ?? '',
        phone: data.phone ?? '',
        email: data.email ?? '',
        isPrimary: data.isPrimary ?? false,
      },
    })
  },

  deactivateContact(dealerId: number, contactId: number) {
    return prisma.dealerContact.updateMany({ where: { id: contactId, dealerId }, data: { isActive: false } })
  },

  requests(dealerId: number) {
    return prisma.request.findMany({
      where: { dealerId },
      include: { type: true, owner: true, dealer: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  visits(dealerId: number) {
    return prisma.visit.findMany({
      where: { dealerId },
      include: { visitType: true, owner: true, dealer: true, prospect: true },
      orderBy: { scheduledAt: 'desc' },
    })
  },

  timeline(dealerId: number) {
    return prisma.timelineEntry.findMany({
      where: { entityType: 'dealer', entityId: dealerId },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findAllNames() {
    return prisma.dealer.findMany({ select: { name: true } })
  },

  findPendingCandidateNames() {
    return prisma.dealerImportCandidate.findMany({ where: { status: 'pending' }, select: { name: true } })
  },

  createImportCandidates(rows: Prisma.DealerImportCandidateCreateManyInput[]) {
    return prisma.dealerImportCandidate.createMany({ data: rows })
  },

  listPendingCandidates(q?: string) {
    return prisma.dealerImportCandidate.findMany({
      where: {
        status: 'pending',
        ...(q ? { name: { contains: q } } : {}),
      },
      orderBy: { name: 'asc' },
      take: 500,
    })
  },

  findCandidateById(id: number) {
    return prisma.dealerImportCandidate.findUnique({ where: { id } })
  },

  markCandidateUsed(id: number, dealerId: number) {
    return prisma.dealerImportCandidate.update({
      where: { id },
      data: { status: 'used', usedDealerId: dealerId, usedAt: new Date() },
    })
  },
}
