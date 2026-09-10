import { z } from 'zod'

const contactSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email('Contact email must be a valid email address.').optional(),
  website: z.string().url('Contact website must be a valid URL.').optional(),
})

const addressSchema = z.object({
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
  postalCode: z.string().optional(),
})

export const createProviderSchema = z.object({
  name: z.string().trim().min(1, 'Provider name is required.'),
  providerCode: z.string().trim().regex(/^[a-zA-Z0-9]+$/, 'Provider code must be alphanumeric.').optional(),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only.').optional(),
  logo: z.string().optional(),
  coverImage: z.string().optional(),
  shortDescription: z.string().optional(),
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
