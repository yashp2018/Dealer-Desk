import { useState } from 'react'
import { useDealers } from '../../hooks/useDealers'
import { ACTIVITY_TYPE_OPTIONS, REMINDER_OPTIONS, type CalendarActivityType } from './calendarEventMapper'

export interface CalendarActivityFormValues {
  title: string
  description: string
  type: CalendarActivityType
  date: string // YYYY-MM-DD, local
  startTime: string // HH:MM, local, 24h
  endTime: string // HH:MM, local, 24h
  reminderMinutes: number | null
  dealerId: string
  priority: number
}

export interface CalendarActivityFormSubmitValues {
  title: string
  description?: string
  type: CalendarActivityType
  start_at: string
  end_at: string
  reminder_minutes: number | null
  dealer_id?: number
  priority: number
}

const PRIORITY_OPTIONS = [
  { value: 1, label: 'P1 · Critical' },
  { value: 2, label: 'P2 · High' },
  { value: 3, label: 'P3 · Medium' },
  { value: 4, label: 'P4 · Low' },
]

/** Local date + local time -> a Date that represents that exact wall-clock moment, never shifted by UTC conversion. */
function toLocalDate(dateKey: string, time: string): Date | null {
  const [y, m, d] = dateKey.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null
  return new Date(y, m - 1, d, hh, mm, 0, 0)
}

function addMinutesToTime(time: string, minutes: number): string {
  const [hh, mm] = time.split(':').map(Number)
  const total = (hh * 60 + mm + minutes + 24 * 60) % (24 * 60)
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function emptyActivityFormValues(date: string, startTime: string): CalendarActivityFormValues {
  return {
    title: '',
    description: '',
    type: 'task',
    date,
    startTime,
    endTime: addMinutesToTime(startTime, 30),
    reminderMinutes: null,
    dealerId: '',
    priority: 3,
  }
}

interface Props {
  initial: CalendarActivityFormValues
  submitting?: boolean
  submitLabel?: string
  onSubmit: (values: CalendarActivityFormSubmitValues) => void
  onCancel: () => void
  /** Large mobile-friendly controls (min ~44px touch targets) vs. compact desktop controls. */
  size?: 'desktop' | 'mobile'
}

export default function CalendarActivityForm({ initial, submitting, submitLabel = 'Create Task', onSubmit, onCancel, size = 'desktop' }: Props) {
  const [values, setValues] = useState<CalendarActivityFormValues>(initial)
  const [error, setError] = useState<string | null>(null)
  const { data: dealers = [] } = useDealers()

  const mobile = size === 'mobile'
  const inputClass = mobile
    ? 'w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:border-cyan-600 min-h-[44px]'
    : 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
  const labelClass = mobile ? 'mb-1.5 block text-sm font-semibold text-slate-700' : 'block text-xs text-gray-500 mb-1'

  const update = <K extends keyof CalendarActivityFormValues>(key: K, value: CalendarActivityFormValues[K]) => {
    setValues((v) => {
      const next = { ...v, [key]: value }
      // There's no end-time input anymore — a fixed 30-minute duration is
      // always derived from the single time the user picks.
      if (key === 'startTime') {
        next.endTime = addMinutesToTime(value as string, 30)
      }
      return next
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const title = values.title.trim()
    if (!title) { setError('Title is required'); return }
    if (title.length > 200) { setError('Title must be 200 characters or fewer'); return }
    if (values.description.length > 2000) { setError('Notes must be 2000 characters or fewer'); return }

    const start = toLocalDate(values.date, values.startTime)
    const end = toLocalDate(values.date, values.endTime)
    if (!start || !end) { setError('Please pick a valid date and time'); return }
    if (end.getTime() <= start.getTime()) { setError('End time must be after start time'); return }

    onSubmit({
      title,
      description: values.description.trim() || undefined,
      type: values.type,
      start_at: start.toISOString(),
      end_at: end.toISOString(),
      reminder_minutes: values.reminderMinutes,
      dealer_id: values.dealerId ? Number(values.dealerId) : undefined,
      priority: values.priority,
    })
  }

  return (
    <form onSubmit={handleSubmit} className={mobile ? 'space-y-4' : 'space-y-3'}>
      {error && (
        <div className={mobile ? 'rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700' : 'rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700'} role="alert">
          {error}
        </div>
      )}

      <div>
        <label className={labelClass} htmlFor="activity-title">Title</label>
        <input
          id="activity-title"
          value={values.title}
          onChange={(e) => update('title', e.target.value)}
          maxLength={200}
          required
          autoFocus
          placeholder="e.g. Call ABC Motors"
          className={inputClass}
        />
      </div>

      <div className={mobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-3'}>
        <div>
          <label className={labelClass} htmlFor="activity-date">Date</label>
          <input id="activity-date" type="date" value={values.date} onChange={(e) => update('date', e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass} htmlFor="activity-start">Time</label>
          <input id="activity-start" type="time" value={values.startTime} onChange={(e) => update('startTime', e.target.value)} required className={inputClass} />
        </div>
      </div>

      <div className={mobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-3'}>
        <div>
          <label className={labelClass} htmlFor="activity-type">Type</label>
          <select id="activity-type" value={values.type} onChange={(e) => update('type', e.target.value as CalendarActivityType)} className={inputClass}>
            {ACTIVITY_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="activity-reminder">Reminder</label>
          <select
            id="activity-reminder"
            value={values.reminderMinutes === null ? '' : String(values.reminderMinutes)}
            onChange={(e) => update('reminderMinutes', e.target.value === '' ? null : Number(e.target.value))}
            className={inputClass}
          >
            {REMINDER_OPTIONS.map((opt) => (
              <option key={opt.label} value={opt.value === null ? '' : opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={mobile ? 'grid grid-cols-1 gap-4' : 'grid grid-cols-2 gap-3'}>
        <div>
          <label className={labelClass} htmlFor="activity-dealer">Dealer (optional)</label>
          <select id="activity-dealer" value={values.dealerId} onChange={(e) => update('dealerId', e.target.value)} className={inputClass}>
            <option value="">No dealer</option>
            {dealers.map((d) => (
              <option key={d.id} value={d.id}>{d.display_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="activity-priority">Priority</label>
          <select id="activity-priority" value={values.priority} onChange={(e) => update('priority', Number(e.target.value))} className={inputClass}>
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass} htmlFor="activity-notes">Notes</label>
        <textarea
          id="activity-notes"
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
          maxLength={2000}
          rows={mobile ? 4 : 3}
          placeholder="Optional details…"
          className={`${inputClass} resize-none`}
        />
      </div>

      <div className={mobile ? 'flex gap-3 pt-2' : 'flex justify-end gap-2 pt-1'}>
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className={mobile
            ? 'flex-1 min-h-[44px] rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 disabled:opacity-50'
            : 'rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50'}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className={mobile
            ? 'flex-1 min-h-[44px] rounded-xl bg-cyan-700 py-3 text-sm font-semibold text-white disabled:opacity-50'
            : 'rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50'}
        >
          {submitting ? 'Creating…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
