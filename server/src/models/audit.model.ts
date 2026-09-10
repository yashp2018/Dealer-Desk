import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IAuditLog extends Document {
  _id: mongoose.Types.ObjectId
  actorStaffId?: mongoose.Types.ObjectId | null
  action: string
  entityType: string
  entityId?: mongoose.Types.ObjectId | null
  beforeJson?: unknown
  afterJson?: unknown
  ip?: string | null
  userAgent?: string | null
  requestId?: string | null
  createdAt: Date
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actorStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', default: null },
    action: { type: String, required: true },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, default: null },
    beforeJson: { type: Schema.Types.Mixed, default: null },
    afterJson: { type: Schema.Types.Mixed, default: null },
    ip: { type: String, default: null },
    userAgent: { type: String, default: null },
    requestId: { type: String, default: null },
  },
  { timestamps: true },
)

AuditLogSchema.index({ entityType: 1, entityId: 1 })
AuditLogSchema.index({ actorStaffId: 1 })
AuditLogSchema.index({ createdAt: -1 })

export const AuditLogModel: Model<IAuditLog> =
  mongoose.models.AuditLog ?? mongoose.model<IAuditLog>('AuditLog', AuditLogSchema)
