import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IDealerUser extends Document {
  _id: mongoose.Types.ObjectId
  email: string
  passwordHash: string
  dealerId: mongoose.Types.ObjectId
  name: string
  isActive: boolean
  failedLoginCount: number
  lockedUntil?: Date | null
  createdAt: Date
  updatedAt: Date
}

const DealerUserSchema = new Schema<IDealerUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
    name: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
)

DealerUserSchema.index({ email: 1 })
DealerUserSchema.index({ dealerId: 1 })

export const DealerUserModel: Model<IDealerUser> =
  mongoose.models.DealerUser ?? mongoose.model<IDealerUser>('DealerUser', DealerUserSchema)
