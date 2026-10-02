import { prisma } from '../../config/database'
import { requestRepository } from './request.repository'
import { toRequestDto, toDealerRequestDto, toDealerStatusLabel, toRequestDetailsDto } from './request.mapper'
import { nextRefNo } from '../../common/utils/sequence'
import { recordTimelineEvent } from '../../common/utils/timeline'
import { BadRequestError, InvalidTransitionError, NotFoundError } from '../../common/errors/AppError'
import { CreateRequestInput, DealerCreateRequestInput, toFieldGroups } from './request.validation'

async function getAllowedTransitions(): Promise<Record<string, string[]>> {
  const config = await prisma.appConfig.findUnique({ where: { key: 'status_transitions' } })
  if (config?.value && typeof config.value === 'object') {
    return config.value as Record<string, string[]>
  }
  return { new: ['open', 'cancelled'], open: ['pending', 'done', 'cancelled'], pending: ['open', 'done', 'cancelled'] }
}

export const requestService = {
  async list(
    params: {
      skip: number
      take: number
      q?: string
      status?: string
      priority?: number
      dealerId?: string
      ownerStaffId?: string
      typeId?: string
      startDate?: string
      endDate?: string
    },
    actor: { id: string; permissions: string[] },
  ) {
    const canViewAll = actor.permissions.includes('*') || actor.permissions.includes('requests.view_all')
    const scopedParams = canViewAll ? params : { ...params, ownerStaffId: actor.id }
    const { requests, total } = await requestRepository.findMany(scopedParams)
    return { requests: requests.map(toRequestDto), total }
  },

  async getOrThrow(id: string) {
    const request = await requestRepository.findById(id)
    if (!request) throw new NotFoundError('Request')
    return request
  },

  async details(id: string) {
    await this.getOrThrow(id)
    return requestRepository.fields(id)
  },

  async lines(id: string) {
    await this.getOrThrow(id)
    return requestRepository.lines(id)
  },

  async timeline(id: string) {
    await this.getOrThrow(id)
    return requestRepository.timeline(id)
  },

  async escalations(id: string) {
    await this.getOrThrow(id)
    return requestRepository.escalations(id)
  },

  async create(input: CreateRequestInput, actor: { id: string; permissions: string[] }) {
    const actorStaffId = actor.id
    if (input.client_uuid) {
      const existing = await requestRepository.findByClientUuid(input.client_uuid)
      if (existing) return toRequestDto(existing)
    }

    const type = await prisma.requestType.findUnique({ where: { id: input.type_id } })
    if (!type) throw new BadRequestError('Unknown request type')

    const dealer = await prisma.dealer.findUnique({ where: { id: input.dealer_id } })
    if (!dealer) throw new BadRequestError('Unknown dealer')

    const priority = input.priority ?? type.defaultPriority
    const dueAt = new Date(Date.now() + type.slaHours * 60 * 60 * 1000)

    const canAssignOthers = actor.permissions.includes('*') || actor.permissions.includes('requests.view_all')
    const ownerStaffId = input.owner_staff_id ? (canAssignOthers ? input.owner_staff_id : actor.id) : null

    const request = await prisma.$transaction(async (tx) => {
      const refNo = await nextRefNo('REQ', tx)
      const created = await tx.request.create({
        data: {
          refNo,
          title: input.title ?? type.name,
          description: input.description,
          typeId: input.type_id,
          dealerId: input.dealer_id,
          ownerStaffId,
          priority,
          scheduledAt: input.scheduled_at ? new Date(input.scheduled_at) : null,
          dueAt,
          clientUuid: input.client_uuid ?? null,
          status: 'new',
        },
      })

      const fieldGroups = toFieldGroups(input.fields)
      if (fieldGroups.length > 0) {
        await tx.requestFieldValue.createMany({
          data: fieldGroups.flatMap((group, groupIndex) =>
            Object.entries(group).map(([key, value]) => ({ requestId: created.id, groupIndex, key, value })),
          ),
        })
      }

      if (input.lines && input.lines.length > 0) {
        await tx.requestLine.createMany({
          data: input.lines.map((l) => ({
            requestId: created.id,
            description: l.description,
            qty: l.qty,
            unitRate: l.unit_rate ?? null,
            total: l.unit_rate !== undefined ? l.qty * l.unit_rate : null,
          })),
        })
      }

      await recordTimelineEvent(
        {
          entityType: 'request',
          entityId: created.id,
          eventType: 'created',
          summary: `Request ${refNo} created${input.lines?.length ? ` with ${input.lines.length} item${input.lines.length === 1 ? '' : 's'}` : ''}`,
          actorStaffId,
        },
        tx,
      )
      return created
    })

    const populated = await requestRepository.findById(request.id)
    return toRequestDto(populated!)
  },

  /** Dealer portal request creation — dealerId is forced from authenticated user. */
  async createForDealer(input: DealerCreateRequestInput, dealerId: string) {
    if (input.client_uuid) {
      const existing = await requestRepository.findByClientUuid(input.client_uuid)
      if (existing && existing.dealerId === dealerId) return toDealerRequestDto(existing)
    }

    const type = await prisma.requestType.findUnique({ where: { id: input.type_id } })
    if (!type) throw new BadRequestError('Unknown request type')

    const dealer = await prisma.dealer.findUnique({ where: { id: dealerId } })
    if (!dealer) throw new BadRequestError('Dealer not found')

    const priority = type.defaultPriority
    const dueAt = new Date(Date.now() + type.slaHours * 60 * 60 * 1000)

    const request = await prisma.$transaction(async (tx) => {
      const refNo = await nextRefNo('REQ', tx)
      const created = await tx.request.create({
        data: {
          refNo,
          title: input.title ?? type.name,
          description: input.description,
          typeId: input.type_id,
          dealerId,
          priority,
          scheduledAt: input.scheduled_at ? new Date(input.scheduled_at) : null,
          dueAt,
          clientUuid: input.client_uuid ?? null,
          status: 'new',
        },
      })

      const fieldGroups = toFieldGroups(input.fields)
      if (fieldGroups.length > 0) {
        await tx.requestFieldValue.createMany({
          data: fieldGroups.flatMap((group, groupIndex) =>
            Object.entries(group).map(([key, value]) => ({ requestId: created.id, groupIndex, key, value })),
          ),
        })
      }

      if (input.lines && input.lines.length > 0) {
        await tx.requestLine.createMany({
          data: input.lines.map((l) => ({
            requestId: created.id,
            description: l.description,
            qty: l.qty,
            unitRate: l.unit_rate ?? null,
            total: l.unit_rate !== undefined ? l.qty * l.unit_rate : null,
          })),
        })
      }

      await recordTimelineEvent(
        {
          entityType: 'request',
          entityId: created.id,
          eventType: 'created',
          summary: `Request ${refNo} created by dealer${input.lines?.length ? ` with ${input.lines.length} item${input.lines.length === 1 ? '' : 's'}` : ''}`,
          actorStaffId: null,
        },
        tx,
      )
      return created
    })

    const itemsSuffix = input.lines?.length ? ` (${input.lines.length} item${input.lines.length === 1 ? '' : 's'})` : ''
    const activeStaff = await prisma.staff.findMany({ where: { isActive: true }, select: { id: true } })
    if (activeStaff.length > 0) {
      await prisma.notification.createMany({
        data: activeStaff.map((s) => ({
          staffId: s.id,
          title: 'New Dealer Request',
          body: `${dealer.name} submitted ${request.refNo}${itemsSuffix}`,
          message: `${dealer.name} submitted ${request.refNo}: ${input.title ?? type.name}${itemsSuffix}`,
          linkUrl: `/requests/${request.id}`,
          isRead: false,
        })),
      })
    }

    const populated = await requestRepository.findById(request.id)
    return toDealerRequestDto(populated!)
  },

  async setStatus(id: string, status: string, actorStaffId: string) {
    const request = await this.getOrThrow(id)
    const transitions = await getAllowedTransitions()
    const allowed = transitions[request.status] ?? []
    if (request.status !== status && !allowed.includes(status)) {
      throw new InvalidTransitionError(request.status, status, 'request')
    }

    await prisma.request.update({ where: { id }, data: { status, ...(status === 'done' ? { doneAt: new Date() } : {}) } })
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'status_changed', summary: `Status changed to "${status}"`, actorStaffId })

    const updated = await requestRepository.findById(id)
    if (updated?.dealerId) {
      const label = toDealerStatusLabel(status)
      await prisma.notification.create({
        data: {
          dealerId: updated.dealerId,
          title: 'Request Update',
          body: `${updated.refNo} is now ${label}`,
          message: `Your request ${updated.refNo} (${updated.title}) is now ${label}`,
          linkUrl: `/portal/requests/${updated.id}`,
          isRead: false,
        },
      })
    }
    return toRequestDto(updated!)
  },

  async assign(id: string, staffId: string, actorStaffId: string) {
    await this.getOrThrow(id)
    const staff = await prisma.staff.findUnique({ where: { id: staffId } })
    if (!staff) throw new BadRequestError('Unknown staff member')

    await prisma.request.update({ where: { id }, data: { ownerStaffId: staffId } })
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'assigned', summary: `Assigned to ${staff.name}`, actorStaffId })

    const updated = await requestRepository.findById(id)
    return toRequestDto(updated!)
  },

  async setPriority(id: string, priority: number, reason: string | undefined, actorStaffId: string) {
    await this.getOrThrow(id)
    await prisma.request.update({ where: { id }, data: { priorityOverride: priority, priorityReason: reason ?? null } })
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'priority_changed', summary: `Priority overridden to P${priority}${reason ? ` — ${reason}` : ''}`, actorStaffId })
    const updated = await requestRepository.findById(id)
    return toRequestDto(updated!)
  },

  async reschedule(id: string, dueAt: string, actorStaffId: string) {
    await this.getOrThrow(id)
    await prisma.request.update({ where: { id }, data: { dueAt: new Date(dueAt) } })
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'rescheduled', summary: `Due date moved to ${dueAt}`, actorStaffId })
    const updated = await requestRepository.findById(id)
    return toRequestDto(updated!)
  },

  async addNote(id: string, body: string, actorStaffId: string) {
    await this.getOrThrow(id)
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'note', summary: body, actorStaffId })
    const entries = await requestRepository.timeline(id)
    return entries[0] ?? null
  },

  async push(id: string, actorStaffId: string) {
    const request = await this.getOrThrow(id)
    await prisma.request.update({
      where: { id },
      data: { erpSyncStatus: 'pending', erpExternalRef: request.erpExternalRef ?? `PENDING-${request.refNo}` },
    })
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'erp_push', summary: 'Queued for ERP push', actorStaffId })
    return { pushed: true }
  },

  async revise(id: string, reason: string, actorStaffId: string) {
    const request = await this.getOrThrow(id)
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'revised', summary: `Revision requested: ${reason}`, actorStaffId })
    return toRequestDto(request)
  },

  async saveHandling(id: string, data: { owner_staff_id?: string; scheduled_at?: string; priority?: number }, actorStaffId: string) {
    await this.getOrThrow(id)
    await prisma.request.update({
      where: { id },
      data: {
        ...(data.owner_staff_id ? { ownerStaffId: data.owner_staff_id } : {}),
        ...(data.scheduled_at ? { scheduledAt: new Date(data.scheduled_at) } : {}),
        ...(data.priority ? { priority: data.priority } : {}),
      },
    })
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'handling_updated', summary: 'Handling details updated', actorStaffId })
    const updated = await requestRepository.findById(id)
    return toRequestDto(updated!)
  },

  async saveDetails(id: string, fields: Record<string, string> | Record<string, string>[]) {
    await this.getOrThrow(id)
    const groups = toFieldGroups(fields)
    await Promise.all(groups.map((group, groupIndex) => requestRepository.upsertFields(id, group, groupIndex)))
    const all = await requestRepository.fields(id)
    return toRequestDetailsDto(id, all)
  },

  async remove(id: string, actorStaffId: string) {
    const request = await this.getOrThrow(id)
    await requestRepository.delete(id)
    if (request.dealerId) {
      await recordTimelineEvent({
        entityType: 'dealer',
        entityId: request.dealerId,
        eventType: 'request_deleted',
        summary: `Request ${request.refNo} (${request.title}) was deleted`,
        actorStaffId,
      })
    }
  },
}
