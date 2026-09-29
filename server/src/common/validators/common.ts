import { z } from 'zod'

export const idParam = z.object({
  id: z.coerce.number().int().positive(),
})

export const nestedIdParams = z.object({
  id: z.coerce.number().int().positive(),
  itemId: z.coerce.number().int().positive(),
})

export const paginationQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  sort_by: z.string().optional(),
  sort_dir: z.enum(['asc', 'desc']).optional(),
  q: z.string().optional(),
})

export const dateRangeQuery = z.object({
  start_date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
  end_date: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
})

export const isoDateTime = z.string().refine((val) => !Number.isNaN(Date.parse(val)), {
  message: 'Must be a valid date/time string',
})

// Loose, internationally-friendly phone check — digits/spaces/dashes/parens,
// optional leading +, 7-20 characters. Not a strict E.164 validator (this app
// stores numbers as freeform display strings, not for dialing), just enough
// to reject obvious garbage before it lands in a VARCHAR(191) column.
export const phoneString = z
  .string()
  .trim()
  .regex(/^\+?[\d\s\-().]{7,20}$/, 'Must be a valid phone number')
  .optional()
  .or(z.literal(''))
