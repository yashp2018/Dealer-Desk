import { z } from 'zod'

export const idParam = z.object({ id: z.coerce.number().int().positive() })

export const listDealersQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  q: z.string().optional(),
  territory_id: z.coerce.number().int().positive().optional(),
  tier_id: z.coerce.number().int().positive().optional(),
  owner_staff_id: z.coerce.number().int().positive().optional(),
  health: z.enum(['good', 'warning', 'critical']).optional(),
})

export const updateDealerSchema = z.object({
  display_name: z.string().min(1).optional(),
  phone_primary: z.string().optional(),
  whatsapp_phone: z.string().optional(),
  city: z.string().optional(),
  state_normalized: z.string().optional(),
  tier_id: z.coerce.number().int().positive().optional(),
  territory_id: z.coerce.number().int().positive().nullable().optional(),
  territory_is_manual: z.boolean().optional(),
  owner_staff_id: z.coerce.number().int().positive().nullable().optional(),
})

export const addContactSchema = z.object({
  name: z.string().min(1),
  role_label: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  is_primary: z.boolean().optional(),
})
