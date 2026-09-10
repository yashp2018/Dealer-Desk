import mongoose, { Schema, Document, Model } from 'mongoose'

export interface INotification extends Document {
  _id: mongoose.Types.ObjectId
  staffId: mongoose.Types.ObjectId
  title: string
  body: string
  message: string
  linkUrl?: string | null
  isRead: boolean
  createdAt: Date
}

const NotificationSchema = new Schema<INotification>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    message: { type: String, required: true },
    linkUrl: { type: String, default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true },
)

NotificationSchema.index({ staffId: 1, isRead: 1 })
NotificationSchema.index({ createdAt: -1 })

export const NotificationModel: Model<INotification> =
  mongoose.models.Notification ?? mongoose.model<INotification>('Notification', NotificationSchema)
