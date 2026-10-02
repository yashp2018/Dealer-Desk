import { z } from 'zod'
import { isoDateTime, objectIdString } from '../../common/validators/common'

export const ACTIVITY_TYPES = [
  'task',
  'reminder',
  'meeting',
  'followup',
  'callback',
  'sales_activity',
  'payment_followup',
  'delivery',
  'service_followup',
] as const
export const REMINDER_MINUTES = [0, 5, 10, 15, 30, 60, 1440] as const

const reminderMinutes = z.union([z.literal(0), z.literal(5), z.literal(10), z.literal(15), z.literal(30), z.literal(60), z.literal(1440)]).nullable()

export const calendarQuerySchema = z.object({
  start_date: z.string().min(1),
  end_date: z.string().min(1),
})

export const createCalendarActivitySchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().max(2000).optional(),
    type: z.enum(ACTIVITY_TYPES),
    start_at: isoDateTime,
    end_at: isoDateTime,
    timezone: z.string().max(64).optional(),
    reminder_minutes: reminderMinutes.optional(),
    dealer_id: objectIdString.optional(),
    owner_staff_id: objectIdString.optional(),
    priority: z.number().int().min(1).max(4).optional(),
    client_uuid: z.string().uuid().optional(),
  })
  .refine((v) => new Date(v.end_at).getTime() > new Date(v.start_at).getTime(), {
    message: 'End time must be after start time',
    path: ['end_at'],
  })

export const updateCalendarActivitySchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  type: z.enum(ACTIVITY_TYPES).optional(),
  start_at: isoDateTime.optional(),
  end_at: isoDateTime.optional(),
  reminder_minutes: reminderMinutes.optional(),
  dealer_id: objectIdString.nullable().optional(),
  owner_staff_id: objectIdString.optional(),
  priority: z.number().int().min(1).max(4).optional(),
})

export const moveCalendarActivitySchema = z
  .object({ start_at: isoDateTime, end_at: isoDateTime })
  .refine((v) => new Date(v.end_at).getTime() > new Date(v.start_at).getTime(), {
    message: 'End time must be after start time',
    path: ['end_at'],
  })

export const resizeCalendarActivitySchema = z.object({ end_at: isoDateTime })

export type CreateCalendarActivityInput = z.infer<typeof createCalendarActivitySchema>
export type UpdateCalendarActivityInput = z.infer<typeof updateCalendarActivitySchema>
export type MoveCalendarActivityInput = z.infer<typeof moveCalendarActivitySchema>
export type ResizeCalendarActivityInput = z.infer<typeof resizeCalendarActivitySchema>
