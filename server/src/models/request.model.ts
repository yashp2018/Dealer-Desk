import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IRequest extends Document {
  _id: mongoose.Types.ObjectId
  refNo: string
  title: string
  description?: string | null
  typeId: mongoose.Types.ObjectId
  status: string
  priority: number
  priorityOverride?: number | null
  priorityReason?: string | null
  dealerId?: mongoose.Types.ObjectId | null
  prospectId?: mongoose.Types.ObjectId | null
  ownerStaffId?: mongoose.Types.ObjectId | null
  dueAt?: Date | null
  scheduledAt?: Date | null
  completionRequired: number
  completionDone: number
  closedReason?: string | null
  doneAt?: Date | null
  erpExternalRef?: string | null
  erpSyncStatus?: string | null
  clientUuid?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface IRequestFieldValue extends Document {
  requestId: mongoose.Types.ObjectId
  key: string
  value: string
}

export interface IRequestLine extends Document {
  requestId: mongoose.Types.ObjectId
  description: string
  qty: number
  unitRate?: number | null
  total?: number | null
}

const RequestSchema = new Schema<IRequest>(
  {
    refNo: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: null },
    typeId: { type: Schema.Types.ObjectId, ref: 'RequestType', required: true },
    status: { type: String, default: 'new' },
    priority: { type: Number, default: 3 },
    priorityOverride: { type: Number, default: null },
    priorityReason: { type: String, default: null },
    dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', default: null },
    prospectId: { type: Schema.Types.ObjectId, ref: 'Prospect', default: null },
    ownerStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', default: null },
    dueAt: { type: Date, default: null },
    scheduledAt: { type: Date, default: null },
    completionRequired: { type: Number, default: 0 },
    completionDone: { type: Number, default: 0 },
    closedReason: { type: String, default: null },
    doneAt: { type: Date, default: null },
    erpExternalRef: { type: String, default: null },
    erpSyncStatus: { type: String, default: null },
    clientUuid: { type: String, unique: true, sparse: true, default: null },
  },
  { timestamps: true },
)

RequestSchema.index({ refNo: 1 })
RequestSchema.index({ status: 1 })
RequestSchema.index({ priority: 1 })
RequestSchema.index({ dealerId: 1 })
RequestSchema.index({ ownerStaffId: 1 })
RequestSchema.index({ dueAt: 1 })
RequestSchema.index({ scheduledAt: 1 })
RequestSchema.index({ title: 'text', refNo: 'text' })

const RequestFieldValueSchema = new Schema<IRequestFieldValue>({
  requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
  key: { type: String, required: true },
  value: { type: String, required: true },
})
RequestFieldValueSchema.index({ requestId: 1, key: 1 }, { unique: true })

const RequestLineSchema = new Schema<IRequestLine>({
  requestId: { type: Schema.Types.ObjectId, ref: 'Request', required: true },
  description: { type: String, required: true },
  qty: { type: Number, default: 1 },
  unitRate: { type: Number, default: null },
  total: { type: Number, default: null },
})
RequestLineSchema.index({ requestId: 1 })

export const RequestModel: Model<IRequest> =
  mongoose.models.Request ?? mongoose.model<IRequest>('Request', RequestSchema)

export const RequestFieldValueModel: Model<IRequestFieldValue> =
  mongoose.models.RequestFieldValue ?? mongoose.model<IRequestFieldValue>('RequestFieldValue', RequestFieldValueSchema)

export const RequestLineModel: Model<IRequestLine> =
  mongoose.models.RequestLine ?? mongoose.model<IRequestLine>('RequestLine', RequestLineSchema)
