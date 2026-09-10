import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProspect extends Document {
  _id: mongoose.Types.ObjectId
  refNo: string
  companyName: string
  contactName: string
  email: string
  phone: string
  whatsapp: string
  city: string
  stateNormalized: string
  stage: string
  stageChangedAt: Date
  ownerStaffId: mongoose.Types.ObjectId
  source: string
  convertedDealerId?: mongoose.Types.ObjectId | null
  createdAt: Date
  updatedAt: Date
}

export interface IOnboardingItem extends Document {
  _id: mongoose.Types.ObjectId
  prospectId: mongoose.Types.ObjectId
  docName: string
  isRequired: boolean
  status: 'pending' | 'received' | 'verified' | 'rejected'
}

const ProspectSchema = new Schema<IProspect>(
  {
    refNo: { type: String, required: true, unique: true },
    companyName: { type: String, required: true, trim: true },
    contactName: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    whatsapp: { type: String, default: '' },
    city: { type: String, default: '' },
    stateNormalized: { type: String, default: '' },
    stage: { type: String, default: 'new' },
    stageChangedAt: { type: Date, default: Date.now },
    ownerStaffId: { type: Schema.Types.ObjectId, ref: 'Staff', required: true },
    source: { type: String, default: '' },
    convertedDealerId: { type: Schema.Types.ObjectId, ref: 'Dealer', default: null },
  },
  { timestamps: true },
)

ProspectSchema.index({ refNo: 1 })
ProspectSchema.index({ companyName: 'text', contactName: 'text', email: 'text' })
ProspectSchema.index({ stage: 1 })
ProspectSchema.index({ ownerStaffId: 1 })

const OnboardingItemSchema = new Schema<IOnboardingItem>({
  prospectId: { type: Schema.Types.ObjectId, ref: 'Prospect', required: true },
  docName: { type: String, required: true },
  isRequired: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'received', 'verified', 'rejected'], default: 'pending' },
})

OnboardingItemSchema.index({ prospectId: 1 })

export const ProspectModel: Model<IProspect> =
  mongoose.models.Prospect ?? mongoose.model<IProspect>('Prospect', ProspectSchema)

export const OnboardingItemModel: Model<IOnboardingItem> =
  mongoose.models.OnboardingItem ?? mongoose.model<IOnboardingItem>('OnboardingItem', OnboardingItemSchema)
