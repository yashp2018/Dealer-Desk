import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'

const includeRelations = { visitType: true, owner: true, dealer: true, prospect: true } satisfies Prisma.VisitInclude

export const visitRepository = {
  async findMany(params: {
    skip: number
    take: number
    status?: string
    dealerId?: number
    ownerStaffId?: number
    startDate?: string
    endDate?: string
  }) {
    const where: Prisma.VisitWhereInput = {
      ...(params.status ? { status: params.status } : {}),
      ...(params.dealerId ? { dealerId: params.dealerId } : {}),
      ...(params.ownerStaffId ? { ownerStaffId: params.ownerStaffId } : {}),
      ...(params.startDate || params.endDate
        ? {
            scheduledAt: {
              ...(params.startDate ? { gte: new Date(params.startDate) } : {}),
              ...(params.endDate ? { lte: new Date(params.endDate) } : {}),
            },
          }
        : {}),
    }
    const [visits, total] = await Promise.all([
      prisma.visit.findMany({ where, include: includeRelations, orderBy: { scheduledAt: 'asc' }, skip: params.skip, take: params.take }),
      prisma.visit.count({ where }),
    ])
    return { visits, total }
  },

  findById(id: number) {
    return prisma.visit.findUnique({ where: { id }, include: includeRelations })
  },

  findByClientUuid(clientUuid: string) {
    return prisma.visit.findUnique({ where: { clientUuid }, include: includeRelations })
  },

  create(data: Prisma.VisitCreateInput) {
    return prisma.visit.create({ data, include: includeRelations })
  },

  update(id: number, data: Prisma.VisitUpdateInput) {
    return prisma.visit.update({ where: { id }, data, include: includeRelations })
  },

  timeline(visitId: number) {
    return prisma.timelineEntry.findMany({
      where: { entityType: 'visit', entityId: visitId },
      include: { actor: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  listAttachments(visitId: number) {
    return prisma.visitAttachment.findMany({
      where: { visitId },
      include: { uploadedBy: true },
      orderBy: { createdAt: 'desc' },
    })
  },

  findAttachment(visitId: number, attachmentId: number) {
    return prisma.visitAttachment.findFirst({ where: { id: attachmentId, visitId }, include: { uploadedBy: true } })
  },

  createAttachment(data: Prisma.VisitAttachmentUncheckedCreateInput) {
    return prisma.visitAttachment.create({ data, include: { uploadedBy: true } })
  },

  deleteAttachment(attachmentId: number) {
    return prisma.visitAttachment.delete({ where: { id: attachmentId } })
  },
}
