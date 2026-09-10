import mongoose from 'mongoose'
import { IDealer, IDealerContact } from '../../models/dealer.model'
import { ITier } from '../../models/master.model'

export type DealerWithRelations = Omit<IDealer, 'tierId' | 'territoryId'> & {
  tierId: ITier | mongoose.Types.ObjectId
  territoryId: { name: string } | mongoose.Types.ObjectId
  _openRequests: number
  _overdueRequests: number
}

export function toDealerDto(d: DealerWithRelations) {
  const tier = d.tierId as ITier
  const territory = d.territoryId as { name: string }
  return {
    id: String(d._id),
    code: d.code,
    name: d.name,
    display_name: d.displayName,
    tier_id: String(tier._id ?? d.tierId),
    tier_name: tier.name ?? '',
    tier_color: tier.color ?? '#6b7280',
    territory_id: String((territory as { _id?: unknown })._id ?? d.territoryId),
    territory_name: territory.name ?? '',
    city: d.city,
    state_normalized: d.stateNormalized,
    health: d.health,
    health_score: d.healthScore ?? null,
    open_requests: d._openRequests,
    overdue_requests: d._overdueRequests,
    last_contact_at: d.lastContactAt ? d.lastContactAt.toISOString() : null,
    phone_primary: d.phonePrimary,
    whatsapp_phone: d.whatsappPhone,
    owner_staff_id: d.ownerStaffId ? String(d.ownerStaffId) : null,
    client_id: d.clientId ?? null,
    territory_is_manual: d.territoryIsManual,
  }
}

/** Safe dealer info for dealer portal — no internal fields. */
export function toDealerPortalDto(d: DealerWithRelations) {
  return {
    id: String(d._id),
    code: d.code,
    name: d.name,
    display_name: d.displayName,
    city: d.city,
    state_normalized: d.stateNormalized,
    phone_primary: d.phonePrimary,
    whatsapp_phone: d.whatsappPhone,
    tier_name: (d.tierId as ITier).name ?? '',
    territory_name: (d.territoryId as { name: string }).name ?? '',
  }
}

export function toDealerContactDto(c: IDealerContact) {
  return {
    id: String(c._id),
    name: c.name,
    role_label: c.roleLabel,
    phone: c.phone,
    email: c.email,
    is_primary: c.isPrimary,
  }
}
