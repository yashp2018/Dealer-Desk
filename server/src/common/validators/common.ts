import { z } from 'zod'

export const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId')

export const idParam = z.object({
  id: objectId,
})

export const nestedIdParams = z.object({
  id: objectId,
  itemId: objectId,
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
