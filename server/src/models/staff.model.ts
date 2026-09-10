import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IStaff extends Document {
  _id: mongoose.Types.ObjectId
  name: string
  email: string
  passwordHash: string
  isActive: boolean
  failedLoginCount: number
  lockedUntil?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface IRefreshToken extends Document {
  _id: mongoose.Types.ObjectId
  staffId: mongoose.Types.ObjectId
  tokenHash: string
  deviceId: string
  platform: string
  appVersion: string
  osVersion: string
  expiresAt: Date
  revokedAt?: Date | null
  replacedBy?: string | null
  createdAt: Date
}

const StaffSchema = new Schema<IStaff>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    failedLoginCount: { type: Number, default: 0 },
    lockedUntil: { type: Date, default: null },
  },
  { timestamps: true },
)

StaffSchema.index({ email: 1 })
StaffSchema.index({ isActive: 1 })

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    staffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    tokenHash: { type: String, required: true, unique: true },
    deviceId: { type: String, required: true },
    platform: { type: String, required: true },
    appVersion: { type: String, required: true },
    osVersion: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    replacedBy: { type: String, default: null },
  },
  { timestamps: true },
)

RefreshTokenSchema.index({ staffId: 1 })
RefreshTokenSchema.index({ tokenHash: 1 })
RefreshTokenSchema.index({ expiresAt: 1 })

export const StaffModel: Model<IStaff> =
  mongoose.models.Staff ?? mongoose.model<IStaff>('Staff', StaffSchema)

export const RefreshTokenModel: Model<IRefreshToken> =
  mongoose.models.RefreshToken ?? mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema)
