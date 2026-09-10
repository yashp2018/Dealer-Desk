import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ISyncMutation extends Document {
  clientUuid: string
  staffId: mongoose.Types.ObjectId
  opType: string
  entityType: string
  entityId?: mongoose.Types.ObjectId | null
  status: 'applied' | 'failed'
  error?: string | null
  appliedAt: Date
}

const SyncMutationSchema = new Schema<ISyncMutation>({
  clientUuid: { type: String, required: true, unique: true },
  staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
  opType: { type: String, required: true },
  entityType: { type: String, required: true },
  entityId: { type: Schema.Types.ObjectId, default: null },
  status: { type: String, enum: ['applied', 'failed'], default: 'applied' },
  error: { type: String, default: null },
  appliedAt: { type: Date, default: Date.now },
})

SyncMutationSchema.index({ clientUuid: 1 })
SyncMutationSchema.index({ staffId: 1 })

export const SyncMutationModel: Model<ISyncMutation> =
  mongoose.models.SyncMutation ?? mongoose.model<ISyncMutation>('SyncMutation', SyncMutationSchema)
