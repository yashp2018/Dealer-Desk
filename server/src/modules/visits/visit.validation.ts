import { z } from 'zod'
import { isoDateTime, objectIdString } from '../../common/validators/common'

export const listVisitsQuery = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  status: z.string().optional(),
  dealer_id: objectIdString.optional(),
  owner_staff_id: objectIdString.optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
})

export const createVisitSchema = z
  .object({
    dealer_id: objectIdString.optional(),
    prospect_id: objectIdString.optional(),
    visit_type_id: objectIdString,
    scheduled_at: isoDateTime,
    title: z.string().optional(),
    owner_staff_id: objectIdString.optional(),
    client_uuid: z.string().uuid().optional(),
  })
  .refine((v) => v.dealer_id || v.prospect_id, { message: 'Either dealer_id or prospect_id is required' })

export const visitOutcomeSchema = z.object({
  outcome: z.string().min(1),
  outcome_note: z.string().optional(),
  next_step: z.string().optional(),
  next_at: isoDateTime.optional(),
})

export const visitNoteSchema = z.object({
  body: z.string().min(1),
})

export const visitAgendaSchema = z.object({
  items: z.array(
    z.object({
      label: z.string().min(1),
      done: z.boolean(),
    }),
  ),
})

export type CreateVisitInput = z.infer<typeof createVisitSchema>
export type VisitAgendaInput = z.infer<typeof visitAgendaSchema>
