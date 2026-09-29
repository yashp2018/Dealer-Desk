import fs from 'fs'
import path from 'path'
import { prisma } from '../../config/database'
import { visitRepository } from './visit.repository'
import { toVisitDto, toVisitAttachmentDto } from './visit.mapper'
import { nextRefNo } from '../../common/utils/sequence'
import { recordTimelineEvent } from '../../common/utils/timeline'
import { visitAttachmentDir } from '../../common/utils/uploads'
import { BadRequestError, ConflictError, NotFoundError } from '../../common/errors/AppError'
import { CreateVisitInput, VisitAgendaInput } from './visit.validation'

interface UploadedFile {
  originalname: string
  filename: string
  mimetype: string  
  size: number
}

export const visitService = {
  async list(
    params: { skip: number; take: number; status?: string; dealerId?: number; ownerStaffId?: number; startDate?: string; endDate?: string },
    actor: { id: number; permissions: string[] },
  ) {
    const canViewAll = actor.permissions.includes('*') || actor.permissions.includes('visits.view_all')
    // A view_own-only staff member can never widen their own results by
    // passing a different owner_staff_id — their effective scope is always
    // just themselves, regardless of what the query string asks for.
    const scopedParams = canViewAll ? params : { ...params, ownerStaffId: actor.id }
    const { visits, total } = await visitRepository.findMany(scopedParams)
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

  async create(input: CreateVisitInput, actor: { id: number; permissions: string[] }) {
    const actorStaffId = actor.id
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

    // A view_all actor can schedule a visit on someone else's behalf;
    // anyone else always ends up owning what they create, regardless of
    // what owner_staff_id they submit.
    const canAssignOthers = actor.permissions.includes('*') || actor.permissions.includes('visits.view_all')
    const ownerStaffId = canAssignOthers && input.owner_staff_id ? input.owner_staff_id : actorStaffId

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
          ownerStaffId,
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

  async cancel(id: number, actorStaffId: number) {
    const visit = await this.getOrThrow(id)
    if (visit.status === 'done' || visit.status === 'cancelled') {
      throw new ConflictError(`Visit is already "${visit.status}" and cannot be cancelled`)
    }

    const updated = await prisma.$transaction(async (tx) => {
      const v = await tx.visit.update({
        where: { id },
        data: { status: 'cancelled', endAt: new Date() },
        include: { visitType: true, owner: true, dealer: true, prospect: true },
      })
      await recordTimelineEvent({ entityType: 'visit', entityId: id, eventType: 'cancelled', summary: 'Visit cancelled', actorStaffId }, tx)
      return v
    })

    return toVisitDto(updated)
  },

  async addNote(id: number, body: string, actorStaffId: number) {
    await this.getOrThrow(id)
    await recordTimelineEvent({ entityType: 'visit', entityId: id, eventType: 'note', summary: body, actorStaffId })
    const entries = await visitRepository.timeline(id)
    return entries[0] ?? null
  },

  async getAgenda(id: number) {
    const visit = await this.getOrThrow(id)
    return (visit.agendaJson as VisitAgendaInput['items'] | null) ?? []
  },

  async updateAgenda(id: number, items: VisitAgendaInput['items'], actorStaffId: number) {
    await this.getOrThrow(id)
    const updated = await prisma.visit.update({ where: { id }, data: { agendaJson: items } })
    await recordTimelineEvent({ entityType: 'visit', entityId: id, eventType: 'agenda_updated', summary: 'Visit agenda updated', actorStaffId })
    return (updated.agendaJson as VisitAgendaInput['items'] | null) ?? []
  },

  async listAttachments(id: number) {
    await this.getOrThrow(id)
    const attachments = await visitRepository.listAttachments(id)
    return attachments.map(toVisitAttachmentDto)
  },

  async addAttachment(id: number, file: UploadedFile, actorStaffId: number) {
    await this.getOrThrow(id)
    const attachment = await visitRepository.createAttachment({
      visitId: id,
      fileName: file.originalname,
      storedName: file.filename,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      uploadedByStaffId: actorStaffId,
    })
    await recordTimelineEvent({ entityType: 'visit', entityId: id, eventType: 'photo_added', summary: `Photo added: ${file.originalname}`, actorStaffId })
    return toVisitAttachmentDto(attachment)
  },

  async getAttachmentFile(id: number, attachmentId: number) {
    await this.getOrThrow(id)
    const attachment = await visitRepository.findAttachment(id, attachmentId)
    if (!attachment) throw new NotFoundError('Attachment')
    return { ...attachment, filePath: path.join(visitAttachmentDir(id), attachment.storedName) }
  },

  async removeAttachment(id: number, attachmentId: number, actorStaffId: number) {
    await this.getOrThrow(id)
    const attachment = await visitRepository.findAttachment(id, attachmentId)
    if (!attachment) throw new NotFoundError('Attachment')

    await visitRepository.deleteAttachment(attachmentId)
    await fs.promises.unlink(path.join(visitAttachmentDir(id), attachment.storedName)).catch(() => {})
    await recordTimelineEvent({ entityType: 'visit', entityId: id, eventType: 'photo_removed', summary: `Photo removed: ${attachment.fileName}`, actorStaffId })
  },
}
