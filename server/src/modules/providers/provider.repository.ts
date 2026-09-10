/**
 * modules/providers/provider.repository.ts
 *
 * All Mongoose data access for the Providers module.
 * No business logic — only DB reads/writes.
 */

import mongoose, { Schema, Model, FilterQuery } from 'mongoose'
import { IProvider, ProviderListQuery } from './provider.types'

// ─── Schema ───────────────────────────────────────────────────────────────────

const ProviderSchema = new Schema<IProvider>(
  {
    providerCode: { type: String, required: true, unique: true, trim: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    logo: String,
    coverImage: String,
    shortDescription: String,
    description: String,
    contact: {
      phone: String,
      email: String,
      website: String,
    },
    address: {
      country: String,
      state: String,
      city: String,
      address: String,
      postalCode: String,
    },
    categories: [String],
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected', 'inactive'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    serviceCount: { type: Number, default: 0 },
    rating: Number,
    reviewCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'Staff' },
  },
  { timestamps: true },
)

ProviderSchema.index({ name: 'text', shortDescription: 'text' })
ProviderSchema.index({ status: 1 })
ProviderSchema.index({ verificationStatus: 1 })
ProviderSchema.index({ categories: 1 })

export const ProviderModel: Model<IProvider> =
  mongoose.models.Provider ?? mongoose.model<IProvider>('Provider', ProviderSchema)

// ─── Repository functions ─────────────────────────────────────────────────────

export async function findProviders(query: ProviderListQuery) {
  const { page = 1, limit = 20, search, category, status, verificationStatus, location } = query
  const filter: FilterQuery<IProvider> = {}

  if (search) filter.$text = { $search: search }
  if (category) filter.categories = category
  if (status) filter.status = status
  if (verificationStatus) filter.verificationStatus = verificationStatus
  if (location) filter['address.city'] = { $regex: location, $options: 'i' }

  const skip = (page - 1) * limit
  const [items, total] = await Promise.all([
    ProviderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ProviderModel.countDocuments(filter),
  ])

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) }
}

export async function findProviderById(id: string) {
  return ProviderModel.findById(id).lean()
}

export async function findProviderByCode(code: string) {
  return ProviderModel.findOne({ providerCode: code.toUpperCase() }).lean()
}

export async function findProviderBySlug(slug: string) {
  return ProviderModel.findOne({ slug: slug.toLowerCase() }).lean()
}

export async function createProvider(data: Partial<IProvider>) {
  return ProviderModel.create(data)
}

export async function updateProvider(id: string, data: Partial<IProvider>) {
  return ProviderModel.findByIdAndUpdate(id, { $set: data }, { new: true, runValidators: true }).lean()
}

export async function deleteProvider(id: string) {
  return ProviderModel.findByIdAndDelete(id)
}

export async function incrementProviderServiceCount(providerId: string, delta: 1 | -1) {
  return ProviderModel.findByIdAndUpdate(
    providerId,
    { $inc: { serviceCount: delta } },
    { new: true },
  )
}

export async function findProvidersUpdatedSince(since: Date) {
  return ProviderModel.find({ updatedAt: { $gt: since } }).lean()
}
