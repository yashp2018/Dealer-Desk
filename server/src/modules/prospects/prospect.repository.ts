import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'

export const prospectRepository = {
  async findMany(params: { skip: number; take: number; q?: string; stage?: string; ownerStaffId?: string }) {
    const where: Prisma.ProspectWhereInput = {
      ...(params.q
        ? { OR: [{ companyName: { contains: params.q } }, { contactName: { contains: params.q } }, { email: { contains: params.q } }] }
        : {}),
      ...(params.stage ? { stage: params.stage } : {}),
      ...(params.ownerStaffId ? { ownerStaffId: params.ownerStaffId } : {}),
    }
    const [prospects, total] = await Promise.all([
      prisma.prospect.findMany({ where, orderBy: { createdAt: 'desc' }, skip: params.skip, take: params.take }),
      prisma.prospect.count({ where }),
    ])
    return { prospects, total }
  },

  findById(id: string) {
    return prisma.prospect.findUnique({ where: { id } })
  },

  create(data: Prisma.ProspectCreateInput) {
    return prisma.prospect.create({ data })
  },

  update(id: string, data: Prisma.ProspectUpdateInput) {
    return prisma.prospect.update({ where: { id }, data })
  },

  onboardingItems(prospectId: string) {
    return prisma.onboardingItem.findMany({ where: { prospectId } })
  },

  visits(prospectId: string) {
    return prisma.visit.findMany({ where: { prospectId }, include: { visitType: true, owner: true, dealer: true, prospect: true }, orderBy: { scheduledAt: 'desc' } })
  },

  requests(prospectId: string) {
    return prisma.request.findMany({ where: { prospectId }, include: { type: true, owner: true, dealer: true }, orderBy: { createdAt: 'desc' } })
  },
}
