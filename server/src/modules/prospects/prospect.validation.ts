import { z } from 'zod'

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
  owner_staff_id: z.coerce.number().int().positive().optional(),
})

export const createProspectSchema = z.object({
  company_name: z.string().min(1),
  contact_name: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  city: z.string().optional(),
  state_normalized: z.string().optional(),
  owner_staff_id: z.number().int().positive(),
  source: z.string().optional(),
})

export const updateProspectSchema = createProspectSchema.partial()

export const setStageSchema = z.object({ stage: z.enum(PROSPECT_STAGES) })
export const convertSchema = z.object({ tier_id: z.number().int().positive().optional() })
export const onboardingStatusSchema = z.object({ status: z.enum(['pending', 'received', 'verified', 'rejected']) })

export type CreateProspectInput = z.infer<typeof createProspectSchema>
