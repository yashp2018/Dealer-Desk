/**
 * modules/services/service.repository.ts
 *
 * All Mongoose data access for the Services module.
 * No business logic here — only DB reads/writes.
 */

import mongoose, { Schema, Model, FilterQuery } from 'mongoose'
import { IService, ServiceListQuery } from './service.types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const PricingSchema = new Schema(
  {
    type: { type: String, enum: ['free', 'fixed', 'range', 'quote'], required: true },
    amount: Number,
    minAmount: Number,
    maxAmount: Number,
    currency: { type: String, default: 'USD' },
  },
  { _id: false },
)

const AvailabilitySchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
    days: [String],
    startTime: String,
    endTime: String,
  },
  { _id: false },
)

const ServiceSchema = new Schema<IService>(
  {
    serviceCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    categoryId: String,
    categoryName: String,
    shortDescription: String,
    description: String,
    images: [String],
    providerId: { type: Schema.Types.ObjectId, ref: 'Provider' },
    serviceType: String,
    pricing: PricingSchema,
    duration: {
      value: Number,
      unit: { type: String, enum: ['minutes', 'hours', 'days'] },
    },
    location: {
      country: String,
      state: String,
      city: String,
      address: String,
    },
    availability: AvailabilitySchema,
    eligibility: [String],
    requiredDocuments: [String],
    features: [String],
    termsAndConditions: String,
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'archived'],
      default: 'draft',
    },
    isFeatured: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true },
)

ServiceSchema.index({ name: 'text', shortDescription: 'text' })
ServiceSchema.index({ status: 1 })
ServiceSchema.index({ providerId: 1 })
ServiceSchema.index({ categoryId: 1 })

export const ServiceModel: Model<IService> =
  mongoose.models.Service ?? mongoose.model<IService>('Service', ServiceSchema)

// ─── Repository functions ─────────────────────────────────────────────────────

export async function findServices(query: ServiceListQuery) {
  const { page = 1, limit = 20, search, category, provider, status, location } = query
  const filter: FilterQuery<IService> = {}

  if (search) filter.$text = { $search: search }
  if (category) filter.categoryId = category
  if (provider) filter.providerId = new mongoose.Types.ObjectId(provider)
  if (status) filter.status = status
  if (location) filter['location.city'] = { $regex: location, $options: 'i' }

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    ServiceModel.find(filter)
      .populate('providerId', 'name logo verificationStatus')
      .sort({ isFeatured: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ServiceModel.countDocuments(filter),
  ])

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function findServiceById(id: string) {
  return ServiceModel.findById(id)
    .populate('providerId', 'name logo verificationStatus status')
    .lean()
}

export async function findServiceByCode(code: string) {
  return ServiceModel.findOne({ serviceCode: code.toUpperCase() }).lean()
}

export async function findServiceBySlug(slug: string) {
  return ServiceModel.findOne({ slug: slug.toLowerCase() }).lean()
}

export async function createService(data: Partial<IService>) {
  return ServiceModel.create(data)
}

export async function updateService(id: string, data: Partial<IService>) {
  return ServiceModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true })
    .populate('providerId', 'name logo verificationStatus status')
    .lean()
}

export async function deleteService(id: string) {
  return ServiceModel.findByIdAndDelete(id)
}

export async function findServicesByProvider(providerId: string) {
  return ServiceModel.find({ providerId: new mongoose.Types.ObjectId(providerId) })
    .select('serviceCode name slug status pricing isFeatured')
    .lean()
}

export async function findServicesUpdatedSince(since: Date) {
  return ServiceModel.find({ updatedAt: { $gt: since } }).lean()
}
