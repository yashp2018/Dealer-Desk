import mongoose from 'mongoose'
import { IVisit } from '../../models/visit.model'
import { IVisitType } from '../../models/master.model'
import { IStaff } from '../../models/staff.model'
import { IDealer } from '../../models/dealer.model'

type VisitWithRelations = Omit<IVisit, 'visitTypeId' | 'ownerStaffId' | 'dealerId'> & {
  visitTypeId: IVisitType | mongoose.Types.ObjectId
  ownerStaffId: IStaff | mongoose.Types.ObjectId
  dealerId?: IDealer | mongoose.Types.ObjectId | null
}

export function toVisitDto(v: VisitWithRelations) {
  const visitType = v.visitTypeId as IVisitType
  const owner = v.ownerStaffId as IStaff
  const dealer = v.dealerId as IDealer | null | undefined
  return {
    id: String(v._id),
    ref: v.refNo,
    ref_no: v.refNo,
    dealer_id: dealer ? String((dealer as { _id?: unknown })._id ?? v.dealerId) : null,
    dealer_name: dealer?.name ?? '',
    visit_type: visitType?.name ?? '',
    title: v.title,
    scheduled_at: v.scheduledAt.toISOString(),
    status: v.status,
    outcome: v.outcome ?? null,
    outcome_note: v.outcomeNote ?? null,
    next_step: v.nextStep ?? null,
    next_at: v.nextAt ? v.nextAt.toISOString() : null,
    owner_name: owner?.name ?? '',
    owner_staff_id: owner ? String((owner as { _id?: unknown })._id ?? v.ownerStaffId) : null,
    agenda_json: v.agendaJson ? JSON.stringify(v.agendaJson) : null,
  }
}
