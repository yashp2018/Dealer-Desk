import { z } from 'zod'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId')

export const listRequestsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  q: z.string().optional(),
  status: z.string().optional(),
  priority: z.coerce.number().int().min(1).max(4).optional(),
  dealer_id: objectId.optional(),
  owner_staff_id: objectId.optional(),
  type_id: objectId.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export const createRequestSchema = z.object({
  dealer_id: objectId,
  type_id: objectId,
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(4).optional(),
  owner_staff_id: objectId.optional(),
  scheduled_at: z.string().optional(),
  fields: z.record(z.string()).optional(),
  client_uuid: z.string().uuid().optional(),
})

/** Dealer portal request creation — dealer_id is stripped/ignored (set from auth). */
export const dealerCreateRequestSchema = z.object({
  type_id: objectId,
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(4).optional(),
  scheduled_at: z.string().optional(),
  fields: z.record(z.string()).optional(),
  client_uuid: z.string().uuid().optional(),
})

export const setStatusSchema = z.object({ status: z.string().min(1) })
export const assignSchema = z.object({ staff_id: objectId })
export const prioritySchema = z.object({
  priority: z.number().int().min(1).max(4),
  reason: z.string().optional(),
})
export const rescheduleSchema = z.object({ due_at: z.string().min(1) })
export const noteSchema = z.object({ body: z.string().min(1) })
export const reviseSchema = z.object({ reason: z.string().min(1) })
export const handlingSchema = z.object({
  owner_staff_id: objectId.optional(),
  scheduled_at: z.string().optional(),
  priority: z.number().int().min(1).max(4).optional(),
})
export const detailsSchema = z.object({ fields: z.record(z.string()) })

export type CreateRequestInput = z.infer<typeof createRequestSchema>
export type DealerCreateRequestInput = z.infer<typeof dealerCreateRequestSchema>
