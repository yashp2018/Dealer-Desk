import { Prospect, OnboardingItem } from '@prisma/client'

export function toProspectDto(p: Prospect) {
  return {
    id: p.id,
    ref_no: p.refNo,
    company_name: p.companyName,
    contact_name: p.contactName,
    email: p.email,
    phone: p.phone,
    whatsapp: p.whatsapp,
    city: p.city,
    state_normalized: p.stateNormalized,
    stage: p.stage,
    stage_changed_at: p.stageChangedAt.toISOString(),
    owner_staff_id: p.ownerStaffId,
    source: p.source,
    converted_dealer_id: p.convertedDealerId,
    created_at: p.createdAt.toISOString(),
  }
}

export function toOnboardingItemDto(i: OnboardingItem) {
  return { id: i.id, doc_name: i.docName, is_required: i.isRequired, status: i.status }
}
