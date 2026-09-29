import { z } from 'zod'

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Must be a 24-hour HH:MM time').optional()

const pricingSchema = z
  .object({
    type: z.enum(['free', 'fixed', 'range', 'quote']),
    amount: z.number().min(0).optional(),
    minAmount: z.number().min(0).optional(),
    maxAmount: z.number().min(0).optional(),
    currency: z.string().length(3, 'Currency must be a 3-letter ISO code, e.g. INR').optional(),
  })
  .refine((p) => p.type !== 'range' || p.minAmount === undefined || p.maxAmount === undefined || p.minAmount <= p.maxAmount, {
    message: 'minAmount must not be greater than maxAmount',
    path: ['minAmount'],
  })

const availabilitySchema = z.object({
  enabled: z.boolean().default(true),
  days: z.array(z.enum(WEEKDAYS)).default([]),
  startTime: timeOfDay,
  endTime: timeOfDay,
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
  name: z.string().trim().min(1, 'Name is required.').max(191),
  serviceCode: z.string().trim().max(191).regex(/^[a-zA-Z0-9]+$/, 'Service code must be alphanumeric.').optional(),
  slug: z.string().trim().max(191).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only.').optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  shortDescription: z.string().max(191).optional(),
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
  category: z.coerce.number().int().positive().optional(),
  provider: z.coerce.number().int().positive().optional(),
  location: z.string().optional(),
  status: z.enum(['draft', 'active', 'inactive', 'archived']).optional(),
})

export const serviceIdParam = z.object({ id: z.coerce.number().int().positive() })
