import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IVisit extends Document {
  _id: mongoose.Types.ObjectId
  refNo: string
  dealerId?: mongoose.Types.ObjectId | null
  prospectId?: mongoose.Types.ObjectId | null
  visitTypeId: mongoose.Types.ObjectId
  title: string
  scheduledAt: Date
  startAt?: Date | null
  endAt?: Date | null
  status: string
  outcome?: string | null
  outcomeNote?: string | null
  nextStep?: string | null
  nextAt?: Date | null
  ownerStaffId: mongoose.Types.ObjectId
  agendaJson?: unknown
  clientUuid?: string | null
  createdAt: Date
  updatedAt: Date
}

const VisitSchema = new Schema<IVisit>(
  {
    refNo: { type: String, required: true, unique: true },
    dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', default: null },
    prospectId: { type: Schema.Types.ObjectId, ref: 'Prospect', default: null },
    visitTypeId: { type: Schema.Types.ObjectId, ref: 'VisitType', required: true },
    title: { type: String, default: '' },
    scheduledAt: { type: Date, required: true },
    startAt: { type: Date, default: null },
    endAt: { type: Date, default: null },
    status: { type: String, default: 'scheduled' },
    outcome: { type: String, default: null },
    outcomeNote: { type: String, default: null },
    nextStep: { type: String, default: null },
    nextAt: { type: Date, default: null },
    ownerStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    agendaJson: { type: Schema.Types.Mixed, default: null },
    clientUuid: { type: String, unique: true, sparse: true, default: null },
  },
  { timestamps: true },
)

VisitSchema.index({ dealerId: 1 })
VisitSchema.index({ prospectId: 1 })
VisitSchema.index({ ownerStaffId: 1 })
VisitSchema.index({ scheduledAt: 1 })
VisitSchema.index({ status: 1 })
VisitSchema.index({ title: 'text', refNo: 'text' })

export const VisitModel: Model<IVisit> =
  mongoose.models.Visit ?? mongoose.model<IVisit>('Visit', VisitSchema)
