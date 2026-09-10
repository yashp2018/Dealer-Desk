import { Prisma } from '@prisma/client'
import { dealerRepository } from './dealer.repository'
import { toDealerDto, toDealerContactDto, toDealerPortalDto } from './dealer.mapper'
import { toRequestDto } from '../requests/request.mapper'
import { toVisitDto } from '../visits/visit.mapper'
import { toTimelineDto } from '../requests/request.mapper'
import { NotFoundError } from '../../common/errors/AppError'
import { recordTimelineEvent } from '../../common/utils/timeline'

export const dealerService = {
  async list(params: { skip: number; take: number; q?: string; territoryId?: number; tierId?: number; ownerStaffId?: number; health?: string }) {
    const { dealers, total } = await dealerRepository.findMany(params)
    return { dealers: dealers.map(toDealerDto), total }
  },

  async getOrThrow(id: number) {
    const dealer = await dealerRepository.findById(id)
    if (!dealer) throw new NotFoundError('Dealer')
    return dealer
  },

  async update(id: number, patch: Record<string, unknown>, actorStaffId: number) {
    await this.getOrThrow(id)
    const data: Prisma.DealerUpdateInput = {}
    if ('display_name' in patch) data.displayName = patch.display_name as string
    if ('phone_primary' in patch) data.phonePrimary = patch.phone_primary as string
    if ('whatsapp_phone' in patch) data.whatsappPhone = patch.whatsapp_phone as string
    if ('city' in patch) data.city = patch.city as string
    if ('state_normalized' in patch) data.stateNormalized = patch.state_normalized as string
    if ('tier_id' in patch && patch.tier_id) data.tier = { connect: { id: patch.tier_id as number } }
    if ('territory_id' in patch && patch.territory_id) data.territory = { connect: { id: patch.territory_id as number } }
    if ('territory_is_manual' in patch) data.territoryIsManual = patch.territory_is_manual as boolean
    if ('owner_staff_id' in patch) {
      data.owner = patch.owner_staff_id ? { connect: { id: patch.owner_staff_id as number } } : { disconnect: true }
    }

    await dealerRepository.update(id, data)
    await recordTimelineEvent({ entityType: 'dealer', entityId: id, eventType: 'updated', summary: 'Dealer profile updated', actorStaffId })
    const full = await this.getOrThrow(id)
    return toDealerDto(full)
  },

  async contacts(dealerId: number) {
    await this.getOrThrow(dealerId)
    const contacts = await dealerRepository.contacts(dealerId)
    return contacts.map(toDealerContactDto)
  },

  async addContact(dealerId: number, data: { name: string; role_label?: string; phone?: string; email?: string; is_primary?: boolean }, actorStaffId: number) {
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

  async requests(dealerId: number) {
    await this.getOrThrow(dealerId)
    const requests = await dealerRepository.requests(dealerId)
    return requests.map(toRequestDto)
  },

  async visits(dealerId: number) {
    await this.getOrThrow(dealerId)
    const visits = await dealerRepository.visits(dealerId)
    return visits.map(toVisitDto)
  },

  async timeline(dealerId: number) {
    await this.getOrThrow(dealerId)
    const entries = await dealerRepository.timeline(dealerId)
    return entries.map(toTimelineDto)
  },

  async threeSixty(dealerId: number) {
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
  async getOwnDealer(dealerId: number) {
    const dealer = await dealerRepository.findById(dealerId)
    if (!dealer) throw new NotFoundError('Dealer')
    return toDealerPortalDto(dealer)
  },

  /** Dealer portal: get own requests (safe fields only). */
  async getOwnRequests(dealerId: number) {
    const requests = await dealerRepository.requests(dealerId)
    return requests.map(toRequestDto)
  },
}
