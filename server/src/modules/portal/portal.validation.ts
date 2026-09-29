import { z } from 'zod'
import { phoneString } from '../../common/validators/common'

export const idParam = z.object({ id: z.coerce.number().int().positive() })

export const updateOwnProfileSchema = z.object({
  display_name: z.string().min(1).max(191).optional(),
  phone_primary: phoneString,
  whatsapp_phone: phoneString,
  city: z.string().max(191).optional(),
  state_normalized: z.string().max(191).optional(),
})

export const listRequestsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
})

const requestLineInputSchema = z.object({
  description: z.string().min(1).max(191),
  qty: z.coerce.number().positive().max(100_000),
  unit_rate: z.coerce.number().min(0).max(10_000_000).optional(),
})

export const createRequestSchema = z.object({
  type_id: z.coerce.number().int().positive(),
  title: z.string().min(1).max(191).optional(),
  description: z.string().optional(),
  scheduled_at: z.string().optional(),
  // A single object (one field group) or an array of groups — see
  // request.validation.ts's requestFieldGroupsSchema, kept in sync here since
  // this portal route validates against its own copy of the request schema.
  fields: z.union([z.record(z.string()), z.array(z.record(z.string())).max(20)]).optional(),
  lines: z.array(requestLineInputSchema).max(50).optional(),
  client_uuid: z.string().uuid().optional(),
})

export const catalogListQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
})

export const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8, 'New password must be at least 8 characters').max(72, 'New password must be at most 72 characters'),
})
