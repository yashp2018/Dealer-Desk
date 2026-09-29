import { z } from 'zod'
import { phoneString } from '../../common/validators/common'

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

export const createDealerSchema = z.object({
  name: z.string().min(1).max(191),
  display_name: z.string().min(1).max(191).optional(),
  tier_id: z.coerce.number().int().positive(),
  territory_id: z.coerce.number().int().positive(),
  city: z.string().max(191).optional(),
  state_normalized: z.string().max(191).optional(),
  phone_primary: phoneString,
  whatsapp_phone: phoneString,
  owner_staff_id: z.coerce.number().int().positive().optional(),
  // Set when the name/city/phone were picked from an uploaded import list —
  // lets the server mark that candidate row used instead of leaving it to
  // linger and get offered again next time someone opens the form.
  import_candidate_id: z.coerce.number().int().positive().optional(),
})

export const listImportCandidatesQuery = z.object({
  q: z.string().optional(),
})

export const updateDealerSchema = z.object({
  display_name: z.string().min(1).max(191).optional(),
  phone_primary: phoneString,
  whatsapp_phone: phoneString,
  city: z.string().max(191).optional(),
  state_normalized: z.string().max(191).optional(),
  tier_id: z.coerce.number().int().positive().optional(),
  territory_id: z.coerce.number().int().positive().nullable().optional(),
  territory_is_manual: z.boolean().optional(),
  owner_staff_id: z.coerce.number().int().positive().nullable().optional(),
})

export const addContactSchema = z.object({
  name: z.string().min(1).max(191),
  role_label: z.string().max(191).optional(),
  phone: phoneString,
  email: z.string().email().max(191).optional().or(z.literal('')),
  is_primary: z.boolean().optional(),
})

export type CreateDealerInput = z.infer<typeof createDealerSchema>
