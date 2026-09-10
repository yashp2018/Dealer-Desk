import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'

const includeRelations = { type: true, owner: true, dealer: true } satisfies Prisma.RequestInclude

export const requestRepository = {
  async findMany(params: {
    skip: number
    take: number
    q?: string
    status?: string
    priority?: number
    dealerId?: number
    ownerStaffId?: number
    typeId?: number
    startDate?: string
    endDate?: string
  }) {
    const dateFilter: Prisma.DateTimeFilter = {}
    if (params.startDate) dateFilter.gte = new Date(params.startDate)
    if (params.endDate) dateFilter.lte = new Date(params.endDate)

    const where: Prisma.RequestWhereInput = {
      ...(params.q ? { OR: [{ title: { contains: params.q } }, { refNo: { contains: params.q } }] } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.priority ? { priority: params.priority } : {}),
      ...(params.dealerId ? { dealerId: params.dealerId } : {}),
      ...(params.ownerStaffId ? { ownerStaffId: params.ownerStaffId } : {}),
      ...(params.typeId ? { typeId: params.typeId } : {}),
      ...(params.startDate || params.endDate
        ? { OR: [{ dueAt: dateFilter }, { scheduledAt: dateFilter }] }
        : {}),
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({ where, include: includeRelations, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      prisma.request.count({ where }),
    ])
    return { requests, total }
  },

  findById(id: number) {
    return prisma.request.findUnique({ where: { id }, include: includeRelations })
  },

  findByClientUuid(clientUuid: string) {
    return prisma.request.findUnique({ where: { clientUuid }, include: includeRelations })
  },

  fields(requestId: number) {
    return prisma.requestFieldValue.findMany({ where: { requestId } })
  },

  async upsertFields(requestId: number, fields: Record<string, string>) {
    await Promise.all(
      Object.entries(fields).map(([key, value]) =>
        prisma.requestFieldValue.upsert({
          where: { requestId_key: { requestId, key } },
          create: { requestId, key, value },
          update: { value },
        }),
      ),
    )
  },

  lines(requestId: number) {
    return prisma.requestLine.findMany({ where: { requestId } })
  },

  timeline(requestId: number) {
    return prisma.timelineEntry.findMany({
      where: { entityType: 'request', entityId: requestId },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
    })
  },
}
