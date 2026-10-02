import { Prisma } from '@prisma/client'
import { dealerRepository } from './dealer.repository'
import { toDealerDto, toDealerContactDto, toDealerPortalDto, toImportCandidateDto } from './dealer.mapper'
import { toRequestDto } from '../requests/request.mapper'
import { toVisitDto } from '../visits/visit.mapper'
import { toTimelineDto } from '../requests/request.mapper'
import { NotFoundError, ConflictError } from '../../common/errors/AppError'
import { recordTimelineEvent } from '../../common/utils/timeline'
import { nextRefNo } from '../../common/utils/sequence'
import { CreateDealerInput } from './dealer.validation'
import { parseDealerImportFile } from './dealerImport.parser'

export const dealerService = {
  async list(
    params: { skip: number; take: number; q?: string; territoryId?: string; tierId?: string; ownerStaffId?: string; health?: string },
    actor: { id: string; permissions: string[] },
  ) {
    const canViewAll = actor.permissions.includes('*') || actor.permissions.includes('dealers.view_all')
    // A view_own-only staff member can never widen their own results by
    // passing a different owner_staff_id — their effective scope is always
    // just themselves, regardless of what the query string asks for.
    const scopedParams = canViewAll ? params : { ...params, ownerStaffId: actor.id }
    const { dealers, total } = await dealerRepository.findMany(scopedParams)
    return { dealers: dealers.map(toDealerDto), total }
  },

  async getOrThrow(id: string) {
    const dealer = await dealerRepository.findById(id)
    if (!dealer) throw new NotFoundError('Dealer')
    return dealer
  },

  /**
   * Direct dealer creation — most dealers arrive via prospect conversion
   * (see prospect.service.ts#convert), but staff with dealers.create can
   * also add one directly (e.g. a long-standing dealer with no prospect
   * history to onboard through).
   */
  async create(input: CreateDealerInput, actor: { id: string; permissions: string[] }) {
    const duplicate = await dealerRepository.findByName(input.name)
    if (duplicate) throw new ConflictError(`A dealer named "${duplicate.name}" already exists — possible duplicate`)

    let candidate: Awaited<ReturnType<typeof dealerRepository.findCandidateById>> = null
    if (input.import_candidate_id) {
      candidate = await dealerRepository.findCandidateById(input.import_candidate_id)
      if (!candidate) throw new NotFoundError('Import candidate')
      if (candidate.status === 'used') throw new ConflictError('This imported row has already been used to create a dealer')
    }

    // Only someone with dealers.view_all (admin-tier) can hand a dealer to
    // someone else — a regular staff member always ends up owning what they
    // create, regardless of what owner_staff_id they submit (the frontend
    // already hides this field for them, but that's a UX nicety, not the
    // actual boundary — this check is).
    const canAssignOthers = actor.permissions.includes('*') || actor.permissions.includes('dealers.view_all')
    const ownerStaffId = canAssignOthers && input.owner_staff_id ? input.owner_staff_id : actor.id

    const code = await nextRefNo('DLR', undefined, 3)
    const created = await dealerRepository.create({
      code,
      name: input.name,
      displayName: input.display_name ?? input.name,
      tier: { connect: { id: input.tier_id } },
      territory: { connect: { id: input.territory_id } },
      city: input.city ?? '',
      stateNormalized: input.state_normalized ?? '',
      phonePrimary: input.phone_primary ?? '',
      whatsappPhone: input.whatsapp_phone ?? '',
      owner: { connect: { id: ownerStaffId } },
      health: 'good',
    })

    await recordTimelineEvent({ entityType: 'dealer', entityId: created.id, eventType: 'created', summary: `Dealer ${code} created`, actorStaffId: actor.id })

    if (candidate) {
      await dealerRepository.markCandidateUsed(candidate.id, created.id)
    }

    const full = await this.getOrThrow(created.id)
    return toDealerDto(full)
  },

  /**
   * Parses an uploaded CSV of dealer names (+ optional city/phone/state),
   * stages the valid, non-duplicate rows as pending import candidates, and
   * reports what happened to the rest — never silently drops a row.
   */
  async importCandidates(file: { buffer: Buffer; originalname: string }, actorStaffId: string) {
    const parsed = parseDealerImportFile(file.buffer)

    const [existingDealers, existingCandidates] = await Promise.all([
      dealerRepository.findAllNames(),
      dealerRepository.findPendingCandidateNames(),
    ])
    const existingNames = new Set([...existingDealers, ...existingCandidates].map((r) => r.name.trim().toLowerCase()))

    const seenInFile = new Set<string>()
    const toInsert: Prisma.DealerImportCandidateCreateManyInput[] = []
    let skippedDuplicate = 0

    for (const row of parsed) {
      const key = row.name.trim().toLowerCase()
      if (existingNames.has(key) || seenInFile.has(key)) {
        skippedDuplicate += 1
        continue
      }
      seenInFile.add(key)
      toInsert.push({
        name: row.name,
        city: row.city ?? null,
        phonePrimary: row.phonePrimary ?? null,
        stateNormalized: row.stateNormalized ?? null,
        sourceFileName: file.originalname.slice(0, 191),
        createdBy: actorStaffId,
      })
    }

    if (toInsert.length > 0) {
      await dealerRepository.createImportCandidates(toInsert)
    }

    return {
      total_rows: parsed.length,
      imported: toInsert.length,
      skipped_duplicate: skippedDuplicate,
    }
  },

  async listImportCandidates(q?: string) {
    const candidates = await dealerRepository.listPendingCandidates(q)
    return candidates.map(toImportCandidateDto)
  },

  async update(id: string, patch: Record<string, unknown>, actorStaffId: string) {
    await this.getOrThrow(id)
    const data: Prisma.DealerUpdateInput = {}
    if ('display_name' in patch) data.displayName = patch.display_name as string
    if ('phone_primary' in patch) data.phonePrimary = patch.phone_primary as string
    if ('whatsapp_phone' in patch) data.whatsappPhone = patch.whatsapp_phone as string
    if ('city' in patch) data.city = patch.city as string
    if ('state_normalized' in patch) data.stateNormalized = patch.state_normalized as string
    if ('tier_id' in patch && patch.tier_id) data.tier = { connect: { id: patch.tier_id as string } }
    if ('territory_id' in patch && patch.territory_id) data.territory = { connect: { id: patch.territory_id as string } }
    if ('territory_is_manual' in patch) data.territoryIsManual = patch.territory_is_manual as boolean
    if ('owner_staff_id' in patch) {
      data.owner = patch.owner_staff_id ? { connect: { id: patch.owner_staff_id as string } } : { disconnect: true }
    }

    await dealerRepository.update(id, data)
    await recordTimelineEvent({ entityType: 'dealer', entityId: id, eventType: 'updated', summary: 'Dealer profile updated', actorStaffId })
    const full = await this.getOrThrow(id)
    return toDealerDto(full)
  },

  async contacts(dealerId: string) {
    await this.getOrThrow(dealerId)
    const contacts = await dealerRepository.contacts(dealerId)
    return contacts.map(toDealerContactDto)
  },

  async addContact(dealerId: string, data: { name: string; role_label?: string; phone?: string; email?: string; is_primary?: boolean }, actorStaffId: string) {
    await this.getOrThrow(dealerId)
    const contact = await dealerRepository.addContact(dealerId, {
      name: data.name,
      roleLabel: data.role_label,
      phone: data.phone,
      email: data.email,
      isPrimary: data.is_primary,
    })
    await recordTimelineEvent({ entityType: 'dealer', entityId: dealerId, eventType: 'contact_added', summary: `Contact "${data.name}" added`, actorStaffId })
    return toDealerContactDto(contact)
  },

  async requests(dealerId: string) {
    await this.getOrThrow(dealerId)
    const requests = await dealerRepository.requests(dealerId)
    return requests.map(toRequestDto)
  },

  async visits(dealerId: string) {
    await this.getOrThrow(dealerId)
    const visits = await dealerRepository.visits(dealerId)
    return visits.map(toVisitDto)
  },

  async timeline(dealerId: string) {
    await this.getOrThrow(dealerId)
    const entries = await dealerRepository.timeline(dealerId)
    return entries.map(toTimelineDto)
  },

  async threeSixty(dealerId: string) {
    const dealer = await this.getOrThrow(dealerId)
    const [contacts, requests, visits, timeline] = await Promise.all([
      dealerRepository.contacts(dealerId),
      dealerRepository.requests(dealerId),
      dealerRepository.visits(dealerId),
      dealerRepository.timeline(dealerId),
    ])
    return {
      dealer: toDealerDto(dealer),
      contacts: contacts.map(toDealerContactDto),
      requests: requests.map(toRequestDto),
      visits: visits.map(toVisitDto),
      timeline: timeline.map(toTimelineDto),
    }
  },

  /** Dealer portal: get own dealer (safe fields only). */
  async getOwnDealer(dealerId: string) {
    const dealer = await dealerRepository.findById(dealerId)
    if (!dealer) throw new NotFoundError('Dealer')
    return toDealerPortalDto(dealer)
  },

  /**
   * Dealer portal: update own profile. Deliberately whitelisted — tier,
   * territory, owner, code and health are staff-controlled and never
   * reach this method at all (not just filtered from the request body).
   */
  async updateOwnProfile(dealerId: string, patch: { display_name?: string; phone_primary?: string; whatsapp_phone?: string; city?: string; state_normalized?: string }) {
    await this.getOrThrow(dealerId)
    const data: Prisma.DealerUpdateInput = {}
    if (patch.display_name !== undefined) data.displayName = patch.display_name
    if (patch.phone_primary !== undefined) data.phonePrimary = patch.phone_primary
    if (patch.whatsapp_phone !== undefined) data.whatsappPhone = patch.whatsapp_phone
    if (patch.city !== undefined) data.city = patch.city
    if (patch.state_normalized !== undefined) data.stateNormalized = patch.state_normalized

    await dealerRepository.update(dealerId, data)
    const full = await this.getOrThrow(dealerId)
    return toDealerPortalDto(full)
  },
}
