import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IStatusConfig extends Document {
  entityType: string
  key: string
  label: string
  sortOrder: number
}

export interface IStatusTransition extends Document {
  entityType: string
  fromStatus: string
  toStatus: string
}

export interface IAppConfig extends Document {
  key: string
  value: unknown
}

const StatusConfigSchema = new Schema<IStatusConfig>({
  entityType: { type: String, required: true },
  key: { type: String, required: true },
  label: { type: String, required: true },
  sortOrder: { type: Number, default: 0 },
})
StatusConfigSchema.index({ entityType: 1, key: 1 }, { unique: true })

const StatusTransitionSchema = new Schema<IStatusTransition>({
  entityType: { type: String, required: true },
  fromStatus: { type: String, required: true },
  toStatus: { type: String, required: true },
})
StatusTransitionSchema.index({ entityType: 1, fromStatus: 1, toStatus: 1 }, { unique: true })

const AppConfigSchema = new Schema<IAppConfig>({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
})

export const StatusConfigModel: Model<IStatusConfig> =
  mongoose.models.StatusConfig ?? mongoose.model<IStatusConfig>('StatusConfig', StatusConfigSchema)

export const StatusTransitionModel: Model<IStatusTransition> =
  mongoose.models.StatusTransition ?? mongoose.model<IStatusTransition>('StatusTransition', StatusTransitionSchema)

export const AppConfigModel: Model<IAppConfig> =
  mongoose.models.AppConfig ?? mongoose.model<IAppConfig>('AppConfig', AppConfigSchema)
