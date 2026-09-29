import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '../api/calendar'
import type { CreateCalendarActivityPayload, UpdateCalendarActivityPayload } from '../features/calendar/calendarEventMapper'

export const useCalendarData = (startDate: string, endDate: string) =>
  useQuery({
    queryKey: ['calendar', startDate, endDate],
    queryFn: () => api.getCalendarData(startDate, endDate),
    refetchOnWindowFocus: true,
  })

export const useCalendarActivity = (id: string | undefined) =>
  useQuery({
    queryKey: ['calendar-activity', id],
    queryFn: () => api.getCalendarActivity(id!),
    enabled: !!id,
  })

/**
 * Every mutation invalidates the whole ['calendar'] query family (all date
 * ranges currently cached), not just the range passed in — a create/move can
 * shift an activity into a range the user hasn't navigated to yet, and a
 * stale cache there would silently hide it when they do.
 */
export function useCalendarMutations() {
  const qc = useQueryClient()
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['calendar'] })
    qc.invalidateQueries({ queryKey: ['calendar-activity'] })
  }

  return {
    create: useMutation({
      mutationFn: (data: CreateCalendarActivityPayload) => api.createCalendarActivity(data),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateCalendarActivityPayload }) => api.updateCalendarActivity(id, data),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.deleteCalendarActivity(id),
      onSuccess: (_data, id) => {
        // The record is gone — remove its detail query outright instead of
        // invalidating it, which would trigger a refetch against an id that
        // now 404s (harmless, but a noisy console error right as the details
        // panel is closing).
        qc.removeQueries({ queryKey: ['calendar-activity', id] })
        qc.invalidateQueries({ queryKey: ['calendar'] })
      },
    }),
    complete: useMutation({
      mutationFn: (id: string) => api.completeCalendarActivity(id),
      onSuccess: invalidate,
    }),
    move: useMutation({
      mutationFn: ({ id, startAt, endAt }: { id: string; startAt: string; endAt: string }) => api.moveCalendarActivity(id, startAt, endAt),
      onSuccess: invalidate,
    }),
    resize: useMutation({
      mutationFn: ({ id, endAt }: { id: string; endAt: string }) => api.resizeCalendarActivity(id, endAt),
      onSuccess: invalidate,
    }),
  }
}
