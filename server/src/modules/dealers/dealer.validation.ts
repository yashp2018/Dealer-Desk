import { z } from 'zod'

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid ObjectId')

export const idParam = z.object({ id: objectId })

export const listDealersQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  q: z.string().optional(),
  territory_id: objectId.optional(),
  tier_id: objectId.optional(),
  owner_staff_id: objectId.optional(),
  health: z.enum(['good', 'warning', 'critical']).optional(),
})

export const updateDealerSchema = z.object({
  display_name: z.string().min(1).optional(),
  phone_primary: z.string().optional(),
  whatsapp_phone: z.string().optional(),
  city: z.string().optional(),
  state_normalized: z.string().optional(),
  tier_id: objectId.optional(),
  territory_id: objectId.nullable().optional(),
  territory_is_manual: z.boolean().optional(),
  owner_staff_id: objectId.nullable().optional(),
})

export const addContactSchema = z.object({
  name: z.string().min(1),
  role_label: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  is_primary: z.boolean().optional(),
})
