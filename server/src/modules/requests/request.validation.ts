import { z } from 'zod'
import { objectIdString } from '../../common/validators/common'

export const listRequestsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  q: z.string().optional(),
  status: z.string().optional(),
  priority: z.coerce.number().int().min(1).max(4).optional(),
  dealer_id: objectIdString.optional(),
  owner_staff_id: objectIdString.optional(),
  type_id: objectIdString.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export const requestLineInputSchema = z.object({
  description: z.string().min(1).max(191),
  qty: z.coerce.number().positive().max(100_000),
  unit_rate: z.coerce.number().min(0).max(10_000_000).optional(),
})

// A request's type-specific dynamic fields (e.g. VIN/Mileage/Severity on a
// Warranty Claim) can repeat — one request may cover several vehicles/claims.
// Each element of the array is one repeated group; a plain object is also
// accepted and treated as a single group, for callers that only ever need one.
export const requestFieldGroupsSchema = z
  .union([z.record(z.string()), z.array(z.record(z.string())).max(20)])
  .optional()

export const createRequestSchema = z.object({
  dealer_id: objectIdString,
  type_id: objectIdString,
  title: z.string().min(1).max(191).optional(),
  description: z.string().optional(),
  priority: z.number().int().min(1).max(4).optional(),
  owner_staff_id: objectIdString.optional(),
  scheduled_at: z.string().optional(),
  fields: requestFieldGroupsSchema,
  lines: z.array(requestLineInputSchema).max(50).optional(),
  client_uuid: z.string().uuid().optional(),
})

/**
 * Dealer portal request creation — dealer_id is stripped/ignored (set from
 * auth). No `priority` field: a dealer never sets internal priority, only
 * staff/escalation rules do (see toDealerRequestDto's "deliberately
 * excludes priority" note). This type exists to describe
 * requestService.createForDealer's input; the actual runtime validation for
 * POST /portal/requests lives in portal.validation.ts's own copy — keep
 * both in sync when either changes.
 */
export const dealerCreateRequestSchema = z.object({
  type_id: objectIdString,
  title: z.string().min(1).max(191).optional(),
  description: z.string().optional(),
  scheduled_at: z.string().optional(),
  fields: requestFieldGroupsSchema,
  lines: z.array(requestLineInputSchema).max(50).optional(),
  client_uuid: z.string().uuid().optional(),
})

/** Normalizes the fields union (single object or array of groups) into an array of groups. */
export function toFieldGroups(fields: Record<string, string> | Record<string, string>[] | undefined): Record<string, string>[] {
  if (!fields) return []
  return Array.isArray(fields) ? fields : [fields]
}

export const setStatusSchema = z.object({ status: z.string().min(1) })
export const assignSchema = z.object({ staff_id: objectIdString })
export const prioritySchema = z.object({
  priority: z.number().int().min(1).max(4),
  reason: z.string().optional(),
})
export const rescheduleSchema = z.object({ due_at: z.string().min(1) })
export const noteSchema = z.object({ body: z.string().min(1) })
export const reviseSchema = z.object({ reason: z.string().min(1) })
export const handlingSchema = z.object({
  owner_staff_id: objectIdString.optional(),
  scheduled_at: z.string().optional(),
  priority: z.number().int().min(1).max(4).optional(),
})
export const detailsSchema = z.object({ fields: z.union([z.record(z.string()), z.array(z.record(z.string())).max(20)]) })

export type CreateRequestInput = z.infer<typeof createRequestSchema>
export type DealerCreateRequestInput = z.infer<typeof dealerCreateRequestSchema>
