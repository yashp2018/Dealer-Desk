import { z } from 'zod'
import { phoneString, objectIdString } from '../../common/validators/common'

export const PROSPECT_STAGES = [
  'new',
  'contacted',
  'qualified',
  'visit_planned',
  'visit_completed',
  'onboarding',
  'approved',
  'converted',
  'dropped',
] as const

export const listProspectsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  q: z.string().optional(),
  stage: z.enum(PROSPECT_STAGES).optional(),
  owner_staff_id: objectIdString.optional(),
})

export const createProspectSchema = z.object({
  company_name: z.string().min(1).max(191),
  contact_name: z.string().max(191).optional(),
  email: z.string().email().max(191).optional().or(z.literal('')),
  phone: phoneString,
  whatsapp: phoneString,
  city: z.string().max(191).optional(),
  state_normalized: z.string().max(191).optional(),
  owner_staff_id: objectIdString,
  source: z.string().max(191).optional(),
})

export const updateProspectSchema = createProspectSchema.partial()

export const setStageSchema = z.object({ stage: z.enum(PROSPECT_STAGES) })
export const convertSchema = z.object({ tier_id: objectIdString.optional() })
export const onboardingStatusSchema = z.object({ status: z.enum(['pending', 'received', 'verified', 'rejected']) })

export type CreateProspectInput = z.infer<typeof createProspectSchema>
