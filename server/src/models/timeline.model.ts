import mongoose, { Schema, Document, Model } from 'mongoose'

export interface ITimelineEntry extends Document {
  _id: mongoose.Types.ObjectId
  entityType: string
  entityId: mongoose.Types.ObjectId
  eventType: string
  summary: string
  actorStaffId?: mongoose.Types.ObjectId | null
  createdAt: Date
}

const TimelineEntrySchema = new Schema<ITimelineEntry>(
  {
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, required: true },
    eventType: { type: String, required: true },
    summary: { type: String, required: true },
    actorStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', default: null },
  },
  { timestamps: true },
)

TimelineEntrySchema.index({ entityType: 1, entityId: 1 })
TimelineEntrySchema.index({ actorStaffId: 1 })

export const TimelineEntryModel: Model<ITimelineEntry> =
  mongoose.models.TimelineEntry ?? mongoose.model<ITimelineEntry>('TimelineEntry', TimelineEntrySchema)
