import { prisma } from '../../config/database'
import { visitRepository } from './visit.repository'
import { toVisitDto } from './visit.mapper'
import { nextRefNo } from '../../common/utils/sequence'
import { recordTimelineEvent } from '../../common/utils/timeline'
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/AppError'
import { CreateVisitInput } from './visit.validation'

export const visitService = {
  async list(params: { skip: number; take: number; status?: string; dealerId?: number; ownerStaffId?: number; startDate?: string; endDate?: string }) {
    const { visits, total } = await visitRepository.findMany(params)
    return { visits: visits.map(toVisitDto), total }
  },

  async getOrThrow(id: number) {
    const visit = await visitRepository.findById(id)
    if (!visit) throw new NotFoundError('Visit')
    return visit
  },

  async timeline(id: number) {
    await this.getOrThrow(id)
    return visitRepository.timeline(id)
  },

  async create(input: CreateVisitInput, actorStaffId: number) {
    if (input.client_uuid) {
      const existing = await visitRepository.findByClientUuid(input.client_uuid)
      if (existing) return toVisitDto(existing)
    }

    if (input.dealer_id) {
      const dealer = await prisma.dealer.findUnique({ where: { id: input.dealer_id } })
      if (!dealer) throw new BadRequestError('Unknown dealer')
    }
    if (input.prospect_id) {
      const prospect = await prisma.prospect.findUnique({ where: { id: input.prospect_id } })
      if (!prospect) throw new BadRequestError('Unknown prospect')
    }

    const created = await prisma.$transaction(async (tx) => {
      const refNo = await nextRefNo('VIS', tx)
      const visit = await tx.visit.create({
        data: {
          refNo,
          dealerId: input.dealer_id,
          prospectId: input.prospect_id,
          visitTypeId: input.visit_type_id,
          title: input.title ?? '',
          scheduledAt: new Date(input.scheduled_at),
          ownerStaffId: input.owner_staff_id ?? actorStaffId,
          clientUuid: input.client_uuid,
          status: 'scheduled',
        },
        include: { visitType: true, owner: true, dealer: true, prospect: true },
      })
      await recordTimelineEvent(
        { entityType: 'visit', entityId: visit.id, eventType: 'created', summary: `Visit ${refNo} scheduled`, actorStaffId },
        tx,
      )
      return visit
    })

    return toVisitDto(created)
  },

  async start(id: number, actorStaffId: number) {
    const visit = await this.getOrThrow(id)
    if (visit.status !== 'scheduled') {
      throw new ConflictError(`Visit is "${visit.status}" and cannot be started`)
    }
    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.visit.update({
        where: { id },
        data: { status: 'in_progress', startAt: new Date() },
        include: { visitType: true, owner: true, dealer: true, prospect: true },
      })
      await recordTimelineEvent({ entityType: 'visit', entityId: id, eventType: 'started', summary: 'Visit started', actorStaffId }, tx)
      return v
    })
    return toVisitDto(updated)
  },

  async submitOutcome(
    id: number,
    data: { outcome: string; outcome_note?: string; next_step?: string; next_at?: string },
    actorStaffId: number,
  ) {
    const visit = await this.getOrThrow(id)
    if (visit.status === 'done' || visit.status === 'cancelled') {
      throw new ConflictError(`Visit is already "${visit.status}"`)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.visit.update({
        where: { id },
        data: {
          status: 'done',
          endAt: new Date(),
          outcome: data.outcome,
          outcomeNote: data.outcome_note,
          nextStep: data.next_step,
          nextAt: data.next_at ? new Date(data.next_at) : null,
        },
        include: { visitType: true, owner: true, dealer: true, prospect: true },
      })

      await recordTimelineEvent(
        { entityType: 'visit', entityId: id, eventType: 'outcome_submitted', summary: `Outcome: ${data.outcome}`, actorStaffId },
        tx,
      )

      // If this visit belongs to a prospect and the outcome implies progress,
      // mirror it onto the prospect's stage-change timeline for visibility.
      if (v.prospectId) {
        await recordTimelineEvent(
          {
            entityType: 'prospect',
            entityId: v.prospectId,
            eventType: 'visit_completed',
            summary: `Visit ${v.refNo} completed — outcome: ${data.outcome}`,
            actorStaffId,
          },
          tx,
        )
      }

      return v
    })

    return toVisitDto(updated)
  },
}
