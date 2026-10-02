import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'

const includeRelations = { dealer: true, owner: true } satisfies Prisma.CalendarActivityInclude

export const calendarRepository = {
  findMany(params: { startDate: string; endDate: string; ownerStaffId?: string }) {
    const where: Prisma.CalendarActivityWhereInput = {
      startAt: { lt: new Date(params.endDate) },
      endAt: { gt: new Date(params.startDate) },
      ...(params.ownerStaffId ? { ownerStaffId: params.ownerStaffId } : {}),
    }
    return prisma.calendarActivity.findMany({ where, include: includeRelations, orderBy: { startAt: 'asc' } })
  },

  findById(id: string) {
    return prisma.calendarActivity.findUnique({ where: { id }, include: includeRelations })
  },

  findByClientUuid(clientUuid: string) {
    return prisma.calendarActivity.findUnique({ where: { clientUuid }, include: includeRelations })
  },

  create(data: Prisma.CalendarActivityUncheckedCreateInput) {
    return prisma.calendarActivity.create({ data, include: includeRelations })
  },

  update(id: string, data: Prisma.CalendarActivityUncheckedUpdateInput) {
    return prisma.calendarActivity.update({ where: { id }, data, include: includeRelations })
  },

  delete(id: string) {
    return prisma.calendarActivity.delete({ where: { id } })
  },
}
