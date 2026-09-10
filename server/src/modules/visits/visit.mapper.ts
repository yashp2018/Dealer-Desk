import { Visit, VisitType, Staff, Dealer, Prospect } from '@prisma/client'

type VisitWithRelations = Visit & {
  visitType: VisitType
  owner: Staff
  dealer?: Dealer | null
  prospect?: Prospect | null
}

export function toVisitDto(v: VisitWithRelations) {
  return {
    id: v.id,
    ref: v.refNo,
    ref_no: v.refNo,
    dealer_id: v.dealerId,
    dealer_name: v.dealer?.name ?? '',
    visit_type: v.visitType?.name ?? '',
    title: v.title,
    scheduled_at: v.scheduledAt.toISOString(),
    status: v.status,
    outcome: v.outcome ?? null,
    outcome_note: v.outcomeNote ?? null,
    next_step: v.nextStep ?? null,
    next_at: v.nextAt ? v.nextAt.toISOString() : null,
    owner_name: v.owner?.name ?? '',
    owner_staff_id: v.ownerStaffId,
    agenda_json: v.agendaJson ? JSON.stringify(v.agendaJson) : null,
  }
}
