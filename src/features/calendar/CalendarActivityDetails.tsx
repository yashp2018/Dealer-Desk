import { useState } from 'react'
import { CalendarClock, Check, MapPin, Pencil, Phone, Trash2, User } from 'lucide-react'
import { useCalendarActivity, useCalendarMutations } from '../../hooks/useCalendar'
import { useUiStore } from '../../stores/uiStore'
import ConfirmModal from '../../components/modals/ConfirmModal'
import Spinner from '../../components/loaders/Spinner'
import CalendarActivityForm, { type CalendarActivityFormValues } from './CalendarActivityForm'
import { ACTIVITY_TYPE_OPTIONS, REMINDER_OPTIONS, calendarColors, type CalendarActivity } from './calendarEventMapper'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

/** Reverse of CalendarActivityForm's local-time construction — reads a UTC ISO string back into local date/time fields, never through a UTC-slicing shortcut. */
function toFormValues(activity: CalendarActivity): CalendarActivityFormValues {
  const start = new Date(activity.start_at)
  const end = new Date(activity.end_at)
  return {
    title: activity.title,
    description: activity.description ?? '',
    type: activity.type,
    date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`,
    startTime: `${pad(start.getHours())}:${pad(start.getMinutes())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
    reminderMinutes: activity.reminder_minutes ?? null,
    dealerId: activity.dealer_id ?? '',
    priority: activity.priority,
  }
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatDateOnly(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

interface Props {
  activityId: string
  onClose: () => void
  size?: 'desktop' | 'mobile'
}

export default function CalendarActivityDetails({ activityId, onClose, size = 'desktop' }: Props) {
  const { data: activity, isLoading, isError } = useCalendarActivity(activityId)
  const mutations = useCalendarMutations()
  const addToast = useUiStore((s) => s.addToast)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const mobile = size === 'mobile'

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }
  if (isError || !activity) {
    return <p className="py-8 text-center text-sm text-red-600">This activity could not be loaded — it may have been deleted.</p>
  }

  if (editing) {
    return (
      <CalendarActivityForm
        initial={toFormValues(activity)}
        submitLabel="Save Changes"
        submitting={mutations.update.isPending}
        size={size}
        onCancel={() => setEditing(false)}
        onSubmit={(values) =>
          mutations.update.mutate(
            { id: activity.id, data: values },
            {
              onSuccess: () => { addToast('Task updated', 'success'); setEditing(false) },
              onError: (e) => addToast(e.message ?? 'Unable to update task', 'error'),
            },
          )
        }
      />
    )
  }

  const isCompleted = activity.status === 'completed'
  const color = calendarColors[activity.type] ?? calendarColors.task
  const typeLabel = ACTIVITY_TYPE_OPTIONS.find((t) => t.value === activity.type)?.label ?? activity.type
  const reminderLabel = REMINDER_OPTIONS.find((r) => r.value === (activity.reminder_minutes ?? null))?.label ?? 'None'

  const rows: { icon: typeof CalendarClock; label: string; value: string }[] = [
    { icon: CalendarClock, label: 'Date', value: formatDateOnly(activity.start_at) },
    { icon: CalendarClock, label: 'Time', value: formatTime(activity.start_at) },
    { icon: Phone, label: 'Reminder', value: reminderLabel },
    ...(activity.dealer_name ? [{ icon: MapPin, label: 'Dealer', value: activity.dealer_name }] : []),
    { icon: User, label: 'Owner', value: activity.staff_name ?? '—' },
  ]

  return (
    <div className={mobile ? 'space-y-4' : 'space-y-4'}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-white" style={{ backgroundColor: color }}>
            {typeLabel}
          </span>
          <h3 className={`mt-2 font-bold text-slate-900 dark:text-white ${mobile ? 'text-lg' : 'text-base'}`}>{activity.title}</h3>
          {isCompleted && (
            <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <Check className="h-3.5 w-3.5" /> Completed
            </span>
          )}
        </div>
      </div>

      <div className={`divide-y divide-slate-100 rounded-xl border border-slate-200 dark:divide-slate-800 dark:border-slate-800 ${mobile ? '' : ''}`}>
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <Icon className="h-4 w-4 shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-slate-400">{label}</p>
              <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {activity.description && (
        <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">Notes</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{activity.description}</p>
        </div>
      )}

      <p className="text-xs text-slate-400">
        Created {formatDateTime(activity.created_at)}
        {activity.updated_at !== activity.created_at ? ` · Updated ${formatDateTime(activity.updated_at)}` : ''}
      </p>

      <div className={mobile ? 'flex flex-col gap-2 pt-2' : 'flex flex-wrap justify-end gap-2 pt-1'}>
        {!isCompleted && (
          <button
            type="button"
            onClick={() => mutations.complete.mutate(activity.id, {
              onSuccess: () => addToast('Task completed', 'success'),
              onError: (e) => addToast(e.message ?? 'Unable to complete task', 'error'),
            })}
            disabled={mutations.complete.isPending}
            className={mobile
              ? 'flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white disabled:opacity-50'
              : 'flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50'}
          >
            <Check className="h-4 w-4" /> {mutations.complete.isPending ? 'Completing…' : 'Complete'}
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditing(true)}
          className={mobile
            ? 'flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-700'
            : 'flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50'}
        >
          <Pencil className="h-4 w-4" /> Edit
        </button>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className={mobile
            ? 'flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600'
            : 'flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50'}
        >
          <Trash2 className="h-4 w-4" /> Delete
        </button>
      </div>

      {confirmDelete && (
        <ConfirmModal
          title="Delete this task?"
          message={`"${activity.title}" will be permanently removed from the calendar.`}
          confirmLabel="Delete"
          loading={mutations.remove.isPending}
          onCancel={() => setConfirmDelete(false)}
          onConfirm={() =>
            mutations.remove.mutate(activity.id, {
              onSuccess: () => { addToast('Task deleted', 'success'); onClose() },
              onError: (e) => addToast(e.message ?? 'Unable to delete task', 'error'),
            })
          }
        />
      )}
    </div>
  )
}
