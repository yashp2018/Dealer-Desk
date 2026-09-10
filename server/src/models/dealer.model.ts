import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IDealer extends Document {
  _id: mongoose.Types.ObjectId
  code: string
  name: string
  displayName: string
  tierId: mongoose.Types.ObjectId
  territoryId: mongoose.Types.ObjectId
  city: string
  stateNormalized: string
  health: 'good' | 'warning' | 'critical'
  healthScore?: number | null
  phonePrimary: string
  whatsappPhone: string
  ownerStaffId?: mongoose.Types.ObjectId | null
  clientId?: number | null
  territoryIsManual: boolean
  lastContactAt?: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface IDealerContact extends Document {
  _id: mongoose.Types.ObjectId
  dealerId: mongoose.Types.ObjectId
  name: string
  roleLabel: string
  phone: string
  email: string
  isPrimary: boolean
  isActive: boolean
  createdAt: Date
}

const DealerSchema = new Schema<IDealer>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    displayName: { type: String, required: true, trim: true },
    tierId: { type: Schema.Types.ObjectId, ref: 'Tier', required: true },
    territoryId: { type: Schema.Types.ObjectId, ref: 'Territory', required: true },
    city: { type: String, default: '' },
    stateNormalized: { type: String, default: '' },
    health: { type: String, enum: ['good', 'warning', 'critical'], default: 'good' },
    healthScore: { type: Number, default: null },
    phonePrimary: { type: String, default: '' },
    whatsappPhone: { type: String, default: '' },
    ownerStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', default: null },
    clientId: { type: Number, default: null },
    territoryIsManual: { type: Boolean, default: false },
    lastContactAt: { type: Date, default: null },
  },
  { timestamps: true },
)

DealerSchema.index({ code: 1 })
DealerSchema.index({ name: 'text', code: 'text', city: 'text' })
DealerSchema.index({ territoryId: 1 })
DealerSchema.index({ tierId: 1 })
DealerSchema.index({ ownerStaffId: 1 })
DealerSchema.index({ health: 1 })

const DealerContactSchema = new Schema<IDealerContact>(
  {
    dealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', required: true },
    name: { type: String, required: true, trim: true },
    roleLabel: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    isPrimary: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

DealerContactSchema.index({ dealerId: 1 })

export const DealerModel: Model<IDealer> =
  mongoose.models.Dealer ?? mongoose.model<IDealer>('Dealer', DealerSchema)

export const DealerContactModel: Model<IDealerContact> =
  mongoose.models.DealerContact ?? mongoose.model<IDealerContact>('DealerContact', DealerContactSchema)
