import { z } from 'zod'

const pricingSchema = z.object({
  type: z.enum(['free', 'fixed', 'range', 'quote']),
  amount: z.number().min(0).optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().min(0).optional(),
  currency: z.string().optional(),
})

const availabilitySchema = z.object({
  enabled: z.boolean().default(true),
  days: z.array(z.string()).default([]),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

const durationSchema = z.object({
  value: z.number().positive(),
  unit: z.enum(['minutes', 'hours', 'days']),
})

const locationSchema = z.object({
  country: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
  address: z.string().optional(),
})

export const createServiceSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  serviceCode: z.string().trim().regex(/^[a-zA-Z0-9]+$/, 'Service code must be alphanumeric.').optional(),
  slug: z.string().trim().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only.').optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  images: z.array(z.string()).optional(),
  providerId: z.coerce.number().int().positive().optional(),
  serviceType: z.string().optional(),
  pricing: pricingSchema.optional(),
  duration: durationSchema.optional(),
  location: locationSchema.optional(),
  availability: availabilitySchema.optional(),
  eligibility: z.array(z.string()).optional(),
  requiredDocuments: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),
  termsAndConditions: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
  isFeatured: z.boolean().optional(),
})

export const updateServiceSchema = createServiceSchema.partial()

export const serviceListQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  provider: z.coerce.number().int().positive().optional(),
  location: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
})

export const serviceIdParam = z.object({ id: z.coerce.number().int().positive() })
