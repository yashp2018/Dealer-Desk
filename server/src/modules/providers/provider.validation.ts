import { z } from 'zod'
import { phoneString } from '../../common/validators/common'

const contactSchema = z.object({
  phone: phoneString,
  email: z.string().email('Contact email must be a valid email address.').max(191).optional(),
  website: z.string().url('Contact website must be a valid URL.').max(191).optional(),
})

const addressSchema = z.object({
  country: z.string().max(191).optional(),
  state: z.string().max(191).optional(),
  city: z.string().max(191).optional(),
  address: z.string().max(191).optional(),
  postalCode: z.string().max(191).optional(),
})

export const createProviderSchema = z.object({
  name: z.string().trim().min(1, 'Provider name is required.').max(191),
  providerCode: z.string().trim().max(191).regex(/^[a-zA-Z0-9]+$/, 'Provider code must be alphanumeric.').optional(),
  slug: z.string().trim().max(191).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only.').optional(),
  logo: z.string().url('Logo must be a valid URL.').max(191).optional(),
  coverImage: z.string().url('Cover image must be a valid URL.').max(191).optional(),
  shortDescription: z.string().max(191).optional(),
  description: z.string().optional(),
  contact: contactSchema.optional(),
  address: addressSchema.optional(),
  categories: z.array(z.string()).optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected', 'inactive']).optional(),
  status: z.enum(['active', 'inactive']).optional(),
})

export const updateProviderSchema = createProviderSchema.partial()

export const providerListQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(['active', 'inactive']).optional(),
  verificationStatus: z.enum(['pending', 'verified', 'rejected', 'inactive']).optional(),
})

export const providerIdParam = z.object({ id: z.coerce.number().int().positive() })
