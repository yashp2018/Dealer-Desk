import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'
import { prospectRepository } from './prospect.repository'
import { toProspectDto, toOnboardingItemDto } from './prospect.mapper'
import { toVisitDto } from '../visits/visit.mapper'
import { toRequestDto } from '../requests/request.mapper'
import { nextRefNo } from '../../common/utils/sequence'
import { recordTimelineEvent } from '../../common/utils/timeline'
import { BadRequestError, ConflictError, InvalidTransitionError, NotFoundError } from '../../common/errors/AppError'
import { CreateProspectInput } from './prospect.validation'

// Simple, explicit state machine — mirrors the lifecycle described in the
// project brief. Kept in code (not DB-configurable) because prospect stages
// are a fixed enterprise workflow, unlike request statuses which are tenant-configurable.
const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  new: ['contacted', 'dropped'],
  contacted: ['qualified', 'dropped'],
  qualified: ['visit_planned', 'dropped'],
  visit_planned: ['visit_completed', 'dropped'],
  visit_completed: ['onboarding', 'dropped'],
  onboarding: ['approved', 'dropped'],
  approved: ['converted', 'dropped'],
  converted: [],
  dropped: [],
}

export const prospectService = {
  async list(
    params: { skip: number; take: number; q?: string; stage?: string; ownerStaffId?: string },
    actor: { id: string; permissions: string[] },
  ) {
    const canViewAll = actor.permissions.includes('*') || actor.permissions.includes('prospects.view_all')
    // A view_own-only staff member can never widen their own results by
    // passing a different owner_staff_id — their effective scope is always
    // just themselves, regardless of what the query string asks for.
    const scopedParams = canViewAll ? params : { ...params, ownerStaffId: actor.id }
    const { prospects, total } = await prospectRepository.findMany(scopedParams)
    return { prospects: prospects.map(toProspectDto), total }
  },

  async getOrThrow(id: string) {
    const prospect = await prospectRepository.findById(id)
    if (!prospect) throw new NotFoundError('Prospect')
    return prospect
  },

  async create(input: CreateProspectInput, actor: { id: string; permissions: string[] }) {
    const actorStaffId = actor.id
    // Unlike Requests, every prospect must have an owner (owner_staff_id is
    // required on the schema) — only requests.view_all-equivalent staff can
    // hand a new prospect to someone else; anyone else always ends up
    // owning what they create, regardless of what they submit.
    const canAssignOthers = actor.permissions.includes('*') || actor.permissions.includes('prospects.view_all')
    const ownerStaffId = canAssignOthers ? input.owner_staff_id : actorStaffId

    const created = await prisma.$transaction(async (tx) => {
      const refNo = await nextRefNo('PROS', tx)
      const prospect = await tx.prospect.create({
        data: {
          refNo,
          companyName: input.company_name,
          contactName: input.contact_name ?? '',
          email: input.email ?? '',
          phone: input.phone ?? '',
          whatsapp: input.whatsapp ?? '',
          city: input.city ?? '',
          stateNormalized: input.state_normalized ?? '',
          ownerStaffId,
          source: input.source ?? '',
          stage: 'new',
        },
      })
      await recordTimelineEvent({ entityType: 'prospect', entityId: prospect.id, eventType: 'created', summary: `Prospect ${refNo} created`, actorStaffId }, tx)
      return prospect
    })
    return toProspectDto(created)
  },

  async update(id: string, patch: Record<string, unknown>, actor: { id: string; permissions: string[] }) {
    const actorStaffId = actor.id
    await this.getOrThrow(id)
    const data: Prisma.ProspectUpdateInput = {}
    if ('company_name' in patch) data.companyName = patch.company_name as string
    if ('contact_name' in patch) data.contactName = patch.contact_name as string
    if ('email' in patch) data.email = patch.email as string
    if ('phone' in patch) data.phone = patch.phone as string
    if ('whatsapp' in patch) data.whatsapp = patch.whatsapp as string
    if ('city' in patch) data.city = patch.city as string
    if ('state_normalized' in patch) data.stateNormalized = patch.state_normalized as string
    if ('source' in patch) data.source = patch.source as string
    if ('owner_staff_id' in patch) {
      const canAssignOthers = actor.permissions.includes('*') || actor.permissions.includes('prospects.view_all')
      const ownerStaffId = canAssignOthers ? (patch.owner_staff_id as string) : actorStaffId
      data.owner = { connect: { id: ownerStaffId } }
    }

    const updated = await prospectRepository.update(id, data)
    await recordTimelineEvent({ entityType: 'prospect', entityId: id, eventType: 'updated', summary: 'Prospect details updated', actorStaffId })
    return toProspectDto(updated)
  },

  async setStage(id: string, stage: string, actorStaffId: string) {
    const prospect = await this.getOrThrow(id)
    if (prospect.stage === 'converted') {
      throw new ConflictError('A converted prospect cannot change stage')
    }
    const allowed = ALLOWED_TRANSITIONS[prospect.stage] ?? []
    if (prospect.stage !== stage && !allowed.includes(stage)) {
      throw new InvalidTransitionError(prospect.stage, stage, 'prospect')
    }
    if (stage === 'converted') {
      throw new BadRequestError('Use POST /prospects/:id/convert to convert a prospect')
    }

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.prospect.update({ where: { id }, data: { stage, stageChangedAt: new Date() } })
      await recordTimelineEvent({ entityType: 'prospect', entityId: id, eventType: 'stage_changed', summary: `Stage changed to "${stage}"`, actorStaffId }, tx)
      return p
    })
    return toProspectDto(updated)
  },

  /**
   * Prospect → Dealer conversion. Fully transactional: validates state,
   * checks for an existing dealer with the same contact/company, creates the
   * dealer + primary contact, records timeline + audit trail, and marks the
   * prospect converted — all in a single MySQL transaction so a failure at
   * any step rolls back everything.
   */
  async convert(id: string, tierId: string | undefined, actorStaffId: string) {
    const prospect = await this.getOrThrow(id)

    if (prospect.stage === 'converted' || prospect.convertedDealerId) {
      throw new ConflictError('This prospect has already been converted')
    }
    if (prospect.stage !== 'approved') {
      throw new InvalidTransitionError(prospect.stage, 'converted', 'prospect')
    }

    const duplicate = await prisma.dealer.findFirst({
      where: { OR: [{ name: prospect.companyName }, { phonePrimary: prospect.phone || undefined }] },
    })
    if (duplicate) {
      throw new ConflictError(`A dealer named "${duplicate.name}" already exists — possible duplicate`)
    }

    const defaultTier = tierId ? await prisma.tier.findUnique({ where: { id: tierId } }) : await prisma.tier.findFirst({ orderBy: { id: 'asc' } })
    if (!defaultTier) throw new BadRequestError('No tier configured — cannot convert prospect')

    const defaultTerritory = await prisma.territory.findFirst({ orderBy: { id: 'asc' } })
    if (!defaultTerritory) throw new BadRequestError('No territory configured — cannot convert prospect')

    const result = await prisma.$transaction(async (tx) => {
      const dealerCode = await nextRefNo('DLR', tx, 3)

      const dealer = await tx.dealer.create({
        data: {
          code: dealerCode,
          name: prospect.companyName,
          displayName: prospect.companyName,
          tierId: defaultTier.id,
          territoryId: defaultTerritory.id,
          city: prospect.city,
          stateNormalized: prospect.stateNormalized,
          phonePrimary: prospect.phone,
          whatsappPhone: prospect.whatsapp,
          ownerStaffId: prospect.ownerStaffId,
          health: 'good',
        },
      })

      if (prospect.contactName) {
        await tx.dealerContact.create({
          data: {
            dealerId: dealer.id,
            name: prospect.contactName,
            phone: prospect.phone,
            email: prospect.email,
            isPrimary: true,
          },
        })
      }

      const updatedProspect = await tx.prospect.update({
        where: { id },
        data: { stage: 'converted', stageChangedAt: new Date(), convertedDealerId: dealer.id },
      })

      await recordTimelineEvent(
        { entityType: 'prospect', entityId: id, eventType: 'converted', summary: `Converted to dealer ${dealer.code} (${dealer.name})`, actorStaffId },
        tx,
      )
      await recordTimelineEvent(
        { entityType: 'dealer', entityId: dealer.id, eventType: 'created_from_conversion', summary: `Created by converting prospect ${prospect.refNo}`, actorStaffId },
        tx,
      )

      return { dealer, prospect: updatedProspect }
    })

    return { converted: true, dealer_id: result.dealer.id }
  },

  async checklist(id: string) {
    await this.getOrThrow(id)
    const items = await prospectRepository.onboardingItems(id)
    return items.map(toOnboardingItemDto)
  },

  async setOnboardingItem(prospectId: string, itemId: string, status: string, actorStaffId: string) {
    await this.getOrThrow(prospectId)
    const item = await prisma.onboardingItem.findFirst({ where: { id: itemId, prospectId } })
    if (!item) throw new NotFoundError('Onboarding item')

    const updated = await prisma.onboardingItem.update({ where: { id: itemId }, data: { status } })
    await recordTimelineEvent({
      entityType: 'prospect',
      entityId: prospectId,
      eventType: 'onboarding_item_updated',
      summary: `"${item.docName}" marked ${status}`,
      actorStaffId,
    })
    return toOnboardingItemDto(updated)
  },

  async visits(prospectId: string) {
    await this.getOrThrow(prospectId)
    const visits = await prospectRepository.visits(prospectId)
    return visits.map(toVisitDto)
  },

  async requests(prospectId: string) {
    await this.getOrThrow(prospectId)
    const requests = await prospectRepository.requests(prospectId)
    return requests.map(toRequestDto)
  },
}
