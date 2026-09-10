import mongoose from 'mongoose'
import { requestRepository } from './request.repository'
import { toRequestDto, toDealerRequestDto } from './request.mapper'
import { nextRefNo } from '../../common/utils/sequence'
import { recordTimelineEvent } from '../../common/utils/timeline'
import { BadRequestError, InvalidTransitionError, NotFoundError } from '../../common/errors/AppError'
import { CreateRequestInput, DealerCreateRequestInput } from './request.validation'
import { RequestModel } from '../../models/request.model'
import { RequestTypeModel } from '../../models/requestType.model'
import { DealerModel } from '../../models/dealer.model'
import { StaffModel } from '../../models/staff.model'
import { ConfigModel } from '../../models/config.model'
import { NotificationModel } from '../../models/notification.model'

async function getAllowedTransitions(): Promise<Record<string, string[]>> {
  const config = await ConfigModel.findOne({ key: 'status_transitions' }).lean()
  if (config?.value && typeof config.value === 'object') {
    return config.value as Record<string, string[]>
  }
  return { new: ['open', 'cancelled'], open: ['pending', 'done', 'cancelled'], pending: ['open', 'done', 'cancelled'] }
}

export const requestService = {
  async list(params: {
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
  }) {
    const { requests, total } = await requestRepository.findMany(params)
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

  async create(input: CreateRequestInput, actorStaffId: string) {
    if (input.client_uuid) {
      const existing = await requestRepository.findByClientUuid(input.client_uuid)
      if (existing) return toRequestDto(existing)
    }

    const type = await RequestTypeModel.findById(input.type_id).lean()
    if (!type) throw new BadRequestError('Unknown request type')

    const dealer = await DealerModel.findById(input.dealer_id).lean()
    if (!dealer) throw new BadRequestError('Unknown dealer')

    const priority = input.priority ?? type.defaultPriority
    const dueAt = new Date(Date.now() + type.slaHours * 60 * 60 * 1000)
    const refNo = await nextRefNo('REQ')

    const request = await RequestModel.create({
      refNo,
      title: input.title ?? type.name,
      description: input.description,
      typeId: new mongoose.Types.ObjectId(input.type_id),
      dealerId: new mongoose.Types.ObjectId(input.dealer_id),
      ownerStaffId: input.owner_staff_id ? new mongoose.Types.ObjectId(input.owner_staff_id) : null,
      priority,
      scheduledAt: input.scheduled_at ? new Date(input.scheduled_at) : null,
      dueAt,
      clientUuid: input.client_uuid ?? null,
      status: 'new',
    })

    if (input.fields) {
      const rid = request._id
      await Promise.all(
        Object.entries(input.fields).map(([key, value]) =>
          import('../../models/request.model').then(({ RequestFieldValueModel }) =>
            RequestFieldValueModel.create({ requestId: rid, key, value }),
          ),
        ),
      )
    }

    await recordTimelineEvent({ entityType: 'request', entityId: String(request._id), eventType: 'created', summary: `Request ${refNo} created`, actorStaffId })

    const populated = await requestRepository.findById(String(request._id))
    return toRequestDto(populated!)
  },

  /** Dealer portal request creation — dealerId is forced from authenticated user. */
  async createForDealer(input: DealerCreateRequestInput, dealerId: string, actorStaffId: string) {
    if (input.client_uuid) {
      const existing = await requestRepository.findByClientUuid(input.client_uuid)
      if (existing) {
        // Only return if it belongs to this dealer
        const existingDealerId = existing.dealerId ? String((existing.dealerId as { _id?: unknown })._id ?? existing.dealerId) : null
        if (existingDealerId === dealerId) return toDealerRequestDto(existing)
      }
    }

    const type = await RequestTypeModel.findById(input.type_id).lean()
    if (!type) throw new BadRequestError('Unknown request type')

    const dealer = await DealerModel.findById(dealerId).lean()
    if (!dealer) throw new BadRequestError('Dealer not found')

    const priority = input.priority ?? type.defaultPriority
    const dueAt = new Date(Date.now() + type.slaHours * 60 * 60 * 1000)
    const refNo = await nextRefNo('REQ')

    const request = await RequestModel.create({
      refNo,
      title: input.title ?? type.name,
      description: input.description,
      typeId: new mongoose.Types.ObjectId(input.type_id),
      dealerId: new mongoose.Types.ObjectId(dealerId),
      priority,
      scheduledAt: input.scheduled_at ? new Date(input.scheduled_at) : null,
      dueAt,
      clientUuid: input.client_uuid ?? null,
      status: 'new',
    })

    if (input.fields) {
      const rid = request._id
      await Promise.all(
        Object.entries(input.fields).map(([key, value]) =>
          import('../../models/request.model').then(({ RequestFieldValueModel }) =>
            RequestFieldValueModel.create({ requestId: rid, key, value }),
          ),
        ),
      )
    }

    await recordTimelineEvent({ entityType: 'request', entityId: String(request._id), eventType: 'created', summary: `Request ${refNo} created by dealer`, actorStaffId })

    // Notify admins/staff
    const adminStaff = await StaffModel.find({ isActive: true }).select('_id').lean()
    if (adminStaff.length > 0) {
      await NotificationModel.insertMany(
        adminStaff.map((s) => ({
          staffId: s._id,
          title: 'New Dealer Request',
          body: `${dealer.name} submitted ${refNo}`,
          message: `${dealer.name} submitted ${refNo}: ${input.title ?? type.name}`,
          linkUrl: `/requests/${String(request._id)}`,
          isRead: false,
        })),
      )
    }

    const populated = await requestRepository.findById(String(request._id))
    return toDealerRequestDto(populated!)
  },

  async setStatus(id: string, status: string, actorStaffId: string) {
    const request = await this.getOrThrow(id)
    const transitions = await getAllowedTransitions()
    const allowed = transitions[request.status] ?? []
    if (request.status !== status && !allowed.includes(status)) {
      throw new InvalidTransitionError(request.status, status, 'request')
    }

    await RequestModel.findByIdAndUpdate(id, { status, ...(status === 'done' ? { doneAt: new Date() } : {}) })
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'status_changed', summary: `Status changed to "${status}"`, actorStaffId })

    const updated = await requestRepository.findById(id)
    return toRequestDto(updated!)
  },

  async assign(id: string, staffId: string, actorStaffId: string) {
    await this.getOrThrow(id)
    const staff = await StaffModel.findById(staffId).lean()
    if (!staff) throw new BadRequestError('Unknown staff member')

    await RequestModel.findByIdAndUpdate(id, { ownerStaffId: new mongoose.Types.ObjectId(staffId) })
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'assigned', summary: `Assigned to ${staff.name}`, actorStaffId })

    const updated = await requestRepository.findById(id)
    return toRequestDto(updated!)
  },

  async setPriority(id: string, priority: number, reason: string | undefined, actorStaffId: string) {
    await this.getOrThrow(id)
    await RequestModel.findByIdAndUpdate(id, { priorityOverride: priority, priorityReason: reason ?? null })
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'priority_changed', summary: `Priority overridden to P${priority}${reason ? ` — ${reason}` : ''}`, actorStaffId })
    const updated = await requestRepository.findById(id)
    return toRequestDto(updated!)
  },

  async reschedule(id: string, dueAt: string, actorStaffId: string) {
    await this.getOrThrow(id)
    await RequestModel.findByIdAndUpdate(id, { dueAt: new Date(dueAt) })
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
    const refNo = (request as { refNo?: string }).refNo ?? id
    await RequestModel.findByIdAndUpdate(id, { erpSyncStatus: 'pending', erpExternalRef: (request as { erpExternalRef?: string }).erpExternalRef ?? `PENDING-${refNo}` })
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
    const update: Record<string, unknown> = {}
    if (data.owner_staff_id) update.ownerStaffId = new mongoose.Types.ObjectId(data.owner_staff_id)
    if (data.scheduled_at) update.scheduledAt = new Date(data.scheduled_at)
    if (data.priority) update.priority = data.priority
    await RequestModel.findByIdAndUpdate(id, update)
    await recordTimelineEvent({ entityType: 'request', entityId: id, eventType: 'handling_updated', summary: 'Handling details updated', actorStaffId })
    const updated = await requestRepository.findById(id)
    return toRequestDto(updated!)
  },

  async saveDetails(id: string, fields: Record<string, string>) {
    await this.getOrThrow(id)
    await requestRepository.upsertFields(id, fields)
    const all = await requestRepository.fields(id)
    return { request_id: id, fields: Object.fromEntries(all.map((f) => [f.key, f.value])) }
  },
}
