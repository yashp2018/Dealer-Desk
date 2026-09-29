import { Dealer, DealerContact, DealerImportCandidate, Tier, Territory } from '@prisma/client'

export type DealerWithRelations = Dealer & {
  tier: Tier
  territory: Territory
  _openRequests: number
  _overdueRequests: number
}

export function toDealerDto(d: DealerWithRelations) {
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    display_name: d.displayName,
    tier_id: d.tierId,
    tier_name: d.tier.name,
    tier_color: d.tier.color,
    territory_id: d.territoryId,
    territory_name: d.territory.name,
    city: d.city,
    state_normalized: d.stateNormalized,
    health: d.health,
    health_score: d.healthScore ?? null,
    open_requests: d._openRequests,
    overdue_requests: d._overdueRequests,
    last_contact_at: d.lastContactAt ? d.lastContactAt.toISOString() : null,
    phone_primary: d.phonePrimary,
    whatsapp_phone: d.whatsappPhone,
    owner_staff_id: d.ownerStaffId,
    client_id: d.clientId,
    territory_is_manual: d.territoryIsManual,
  }
}

/** Safe dealer info for dealer portal — no internal fields. */
export function toDealerPortalDto(d: DealerWithRelations) {
  return {
    id: d.id,
    code: d.code,
    name: d.name,
    display_name: d.displayName,
    city: d.city,
    state_normalized: d.stateNormalized,
    phone_primary: d.phonePrimary,
    whatsapp_phone: d.whatsappPhone,
    tier_name: d.tier.name,
    territory_name: d.territory.name,
  }
}

export function toDealerContactDto(c: DealerContact) {
  return {
    id: c.id,
    name: c.name,
    role_label: c.roleLabel,
    phone: c.phone,
    email: c.email,
    is_primary: c.isPrimary,
  }
}

export function toImportCandidateDto(c: DealerImportCandidate) {
  return {
    id: c.id,
    name: c.name,
    city: c.city,
    phone_primary: c.phonePrimary,
    state_normalized: c.stateNormalized,
  }
}
