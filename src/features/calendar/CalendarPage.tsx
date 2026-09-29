import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin, { type DateClickArg } from '@fullcalendar/interaction'
import type { EventClickArg, EventDropArg, DayHeaderContentArg } from '@fullcalendar/core'
import type { EventResizeDoneArg } from '@fullcalendar/interaction'
import { ChevronLeft, ChevronRight, Filter, Plus, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useCalendarData, useCalendarMutations } from '../../hooks/useCalendar'
import type { CalendarEvent } from './calendarEventMapper'
import { calendarColors, mapCalendarEvents, activityTypeLabels } from './calendarEventMapper'
import CalendarActivityForm, { emptyActivityFormValues } from './CalendarActivityForm'
import CalendarActivityDetails from './CalendarActivityDetails'
import { useUiStore } from '../../stores/uiStore'
import { useBootstrap } from '../../hooks/useBootstrap'

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

// Never use date.toISOString().slice(0, 10) for a *local* date key — UTC
// conversion can shift the date across midnight in timezones ahead of/behind
// UTC. Build the key from local getters instead.
const toDateKey = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
const toTimeKey = (date: Date) => `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`

const roundToNearest15 = (date: Date) => {
  const d = new Date(date)
  d.setMinutes(Math.round(d.getMinutes() / 15) * 15, 0, 0)
  return d
}

const startOfWeek = (date: Date) => {
  const d = new Date(date)
  d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1))
  d.setHours(0, 0, 0, 0)
  return d
}

const addDays = (date: Date, n: number) => {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

const weekLabel = (date: Date) =>
  `${date.toLocaleDateString([], { day: 'numeric', month: 'short' })} – ${addDays(date, 6).toLocaleDateString([], { day: 'numeric', month: 'short' })}`

const cn = (...classes: Array<string | false | undefined>) => classes.filter(Boolean).join(' ')

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

interface Filters {
  staffId: string
  territoryId: string
  dealerId: string
  priority: string
  visitType: string
  status: string
  activityType: string
  statGroup: '' | 'visits' | 'escalations' | 'due'
}

const EMPTY_FILTERS: Filters = {
  staffId: '',
  territoryId: '',
  dealerId: '',
  priority: '',
  visitType: '',
  status: '',
  activityType: '',
  statGroup: '',
}

const PRIORITY_OPTIONS = [
  { value: '1', label: 'P1 · Critical' },
  { value: '2', label: 'P2 · High' },
  { value: '3', label: 'P3 · Medium' },
  { value: '4', label: 'P4 · Low' },
]

function applyFilters(events: CalendarEvent[], f: Filters): CalendarEvent[] {
  return events.filter((e) => {
    if (f.staffId && String(e.ownerStaffId) !== f.staffId) return false
    if (f.priority && String(e.priority) !== f.priority) return false
    if (f.visitType && e.visitType !== f.visitType) return false
    if (f.status && e.status !== f.status) return false
    if (f.activityType && e.type !== f.activityType) return false
    if (f.statGroup === 'visits' && e.type !== 'dealer_visit') return false
    if (f.statGroup === 'escalations' && e.type !== 'escalation' && e.type !== 'p1_request') return false
    if (f.statGroup === 'due' && e.type !== 'request_due') return false
    return true
  })
}

// System-generated events (Requests, Visits, Escalations) come from their own
// modules and can't be edited/dragged here — only user-created activities can.
const isSystemGenerated = (type: CalendarEvent['type']) =>
  !['task', 'reminder', 'meeting', 'followup', 'callback', 'sales_activity', 'payment_followup', 'delivery', 'service_followup'].includes(type)

// Shared style tokens so the same control never drifts between two spellings.
const styles = {
  navButton: 'flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  select: 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  chip: 'inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300',
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type ActiveModal = { mode: 'create'; date: string; time: string } | { mode: 'details'; activityId: string } | null

export default function CalendarPage() {
  const nav = useNavigate()
  const bootstrap = useBootstrap()
  const addToast = useUiStore((s) => s.addToast)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [modal, setModal] = useState<ActiveModal>(null)

  const range = { start: toDateKey(weekStart), end: toDateKey(addDays(weekStart, 7)) }
  const calendar = useCalendarData(range.start, range.end)
  const mutations = useCalendarMutations()

  const allEvents = useMemo(() => mapCalendarEvents(calendar.data ?? { requests: [], visits: [], activities: [] }), [calendar.data])
  const events = useMemo(() => applyFilters(allEvents, filters), [allEvents, filters])

  const activeFilterEntries = Object.entries(filters).filter(([, v]) => v)

  const goToday = () => setWeekStart(startOfWeek(new Date()))
  const moveWeek = (n: number) => setWeekStart(addDays(weekStart, n * 7))
  const openEvent = (e: CalendarEvent) => {
    if (e.isCalendarActivity && e.activityId) { setModal({ mode: 'details', activityId: e.activityId }); return }
    nav(e.visitId ? `/visits/${e.visitId}` : `/requests/${e.requestId}`)
  }
  const clearFilter = (key: keyof Filters) => setFilters((f) => ({ ...f, [key]: '' }))

  const openCreateAt = (date: Date, useDefaultTime: boolean) => {
    setModal({ mode: 'create', date: toDateKey(date), time: useDefaultTime ? '09:00' : toTimeKey(date) })
  }

  const handleDateClick = (arg: DateClickArg) => {
    // Month-view cells report allDay:true with no time component — default to 9am per spec.
    openCreateAt(arg.date, arg.allDay)
  }

  const handleEventDrop = (arg: EventDropArg) => {
    const props = arg.event.extendedProps as CalendarEvent
    if (!props.isCalendarActivity || !props.activityId || !arg.event.start) { arg.revert(); return }
    const end = arg.event.end ?? new Date(arg.event.start.getTime() + 30 * 60 * 1000)
    mutations.move.mutate(
      { id: props.activityId, startAt: arg.event.start.toISOString(), endAt: end.toISOString() },
      { onError: (e) => { addToast(e.message ?? 'Unable to move task', 'error'); arg.revert() } },
    )
  }

  const handleEventResize = (arg: EventResizeDoneArg) => {
    const props = arg.event.extendedProps as CalendarEvent
    if (!props.isCalendarActivity || !props.activityId || !arg.event.end) { arg.revert(); return }
    mutations.resize.mutate(
      { id: props.activityId, endAt: arg.event.end.toISOString() },
      { onError: (e) => { addToast(e.message ?? 'Unable to resize task', 'error'); arg.revert() } },
    )
  }

  const staff = bootstrap.data?.staff ?? []
  const territories = bootstrap.data?.territories ?? []
  const visitTypes = bootstrap.data?.visit_types ?? []
  const statuses = bootstrap.data?.statuses ?? {}

  const filterLabel = (key: keyof Filters, value: string): string => {
    if (key === 'staffId') return staff.find((s) => String(s.id) === value)?.name ?? value
    if (key === 'territoryId') return territories.find((t) => String(t.id) === value)?.name ?? value
    if (key === 'priority') return PRIORITY_OPTIONS.find((p) => p.value === value)?.label ?? value
    if (key === 'status') return (statuses as Record<string, string>)[value] ?? value
    if (key === 'activityType') return activityTypeLabels[value] ?? value
    if (key === 'statGroup') return { visits: 'Visits', escalations: 'P1 / Escalation', due: 'Due' }[value] ?? value
    return value
  }

  const fcEvents = events.map((e) => ({
    ...e,
    backgroundColor: calendarColors[e.type] ?? calendarColors.request_due,
    borderColor: calendarColors[e.type] ?? calendarColors.request_due,
    // Only user-created activities can be dragged/resized — Requests and
    // Visits keep their own scheduling flows untouched.
    editable: e.isCalendarActivity === true,
    // System-generated events (Requests/Visits/Escalations) render with a
    // dashed outline so they read as "reference" items you can't reschedule
    // here, distinct from solid user-created activities.
    classNames: isSystemGenerated(e.type) ? ['calendar-event-system'] : ['calendar-event-user'],
    extendedProps: e,
  }))

  return (
    <div className="calendar-page">
      <div className="calendar-desktop-layout">
        {/* ------------------------------------------------------------ */}
        {/* Desktop                                                       */}
        {/* ------------------------------------------------------------ */}
        <section className="calendar-desktop-shell hidden md:block">
          <div className="calendar-desktop-heading">
            <div>
              <h1 className="text-2xl font-bold text-white">Field schedule</h1>
              <p className="calendar-subtitle mt-1 text-sm text-slate-400">
                Coordinate visits and operational work across your dealer network.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <SummaryItem
                value={allEvents.filter((e) => e.type === 'dealer_visit').length}
                label="Visits"
                color={calendarColors.dealer_visit}
                active={filters.statGroup === 'visits'}
                onClick={() => setFilters((f) => ({ ...f, statGroup: f.statGroup === 'visits' ? '' : 'visits' }))}
              />
              <SummaryItem
                value={allEvents.filter((e) => e.type === 'escalation' || e.type === 'p1_request').length}
                label="P1 / Escalation"
                color={calendarColors.escalation}
                active={filters.statGroup === 'escalations'}
                onClick={() => setFilters((f) => ({ ...f, statGroup: f.statGroup === 'escalations' ? '' : 'escalations' }))}
              />
              <SummaryItem
                value={allEvents.filter((e) => e.type === 'request_due').length}
                label="Due"
                color={calendarColors.request_due}
                active={filters.statGroup === 'due'}
                onClick={() => setFilters((f) => ({ ...f, statGroup: f.statGroup === 'due' ? '' : 'due' }))}
              />
            </div>
          </div>

          {/* Toolbar */}
          <div className="space-y-2.5">
            <div className="calendar-desktop-toolbar">
              <div className="flex items-center gap-2">
                <button type="button" aria-label="Previous week" onClick={() => moveWeek(-1)} className={styles.navButton}>
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button type="button" onClick={goToday} className="calendar-today-button">
                  Today
                </button>
                <button type="button" aria-label="Next week" onClick={() => moveWeek(1)} className={styles.navButton}>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
              <h2 className="text-sm font-semibold text-slate-200">{weekLabel(weekStart)}</h2>
              <button
                type="button"
                aria-pressed={showFilters}
                onClick={() => setShowFilters((v) => !v)}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors',
                  showFilters || activeFilterEntries.length > 0
                    ? 'border-teal-300 bg-teal-50 text-teal-800 dark:border-teal-600 dark:bg-teal-950/40 dark:text-teal-300'
                    : 'border-slate-300 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-800',
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                Filters
                {activeFilterEntries.length > 0 && (
                  <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-teal-600 text-[10px] font-bold text-white">
                    {activeFilterEntries.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => openCreateAt(roundToNearest15(new Date()), false)}
                className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-teal-800"
              >
                <Plus className="h-3.5 w-3.5" />
                New Task
              </button>
            </div>

            {/* Active filter chips — only shown once something is set, so the toolbar stays quiet by default */}
            {activeFilterEntries.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {activeFilterEntries.map(([key, value]) => (
                  <span key={key} className={styles.chip}>
                    {filterLabel(key as keyof Filters, value)}
                    <button type="button" aria-label={`Remove ${key} filter`} onClick={() => clearFilter(key as keyof Filters)} className="hover:text-teal-900 dark:hover:text-teal-100">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  Clear all
                </button>
              </div>
            )}

            {showFilters && (
              <div className="grid grid-cols-2 gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/50 sm:grid-cols-4 lg:grid-cols-7">
                <FilterSelect label="Employee" value={filters.staffId} onChange={(v) => setFilters((f) => ({ ...f, staffId: v }))}>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </FilterSelect>
                <FilterSelect label="Territory" value={filters.territoryId} onChange={(v) => setFilters((f) => ({ ...f, territoryId: v }))}>
                  {territories.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </FilterSelect>
                <FilterSelect label="Priority" value={filters.priority} onChange={(v) => setFilters((f) => ({ ...f, priority: v }))}>
                  {PRIORITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </FilterSelect>
                <FilterSelect label="Visit type" value={filters.visitType} onChange={(v) => setFilters((f) => ({ ...f, visitType: v }))}>
                  {visitTypes.map((vt) => (
                    <option key={vt.id} value={vt.name}>{vt.name}</option>
                  ))}
                </FilterSelect>
                <FilterSelect label="Status" value={filters.status} onChange={(v) => setFilters((f) => ({ ...f, status: v }))}>
                  {Object.entries(statuses).map(([k, label]) => (
                    <option key={k} value={k}>{label as string}</option>
                  ))}
                </FilterSelect>
                <FilterSelect label="Activity type" value={filters.activityType} onChange={(v) => setFilters((f) => ({ ...f, activityType: v }))}>
                  {Object.entries(activityTypeLabels).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </FilterSelect>
              </div>
            )}
          </div>

          {calendar.isLoading ? (
            <CalendarSkeleton />
          ) : calendar.isError ? (
            <ErrorState onRetry={() => calendar.refetch()} />
          ) : (
            <div className="field-calendar">
              <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="timeGridWeek"
                initialDate={weekStart}
                firstDay={1}
                weekends
                height="70vh"
                slotMinTime="07:00:00"
                slotMaxTime="20:00:00"
                nowIndicator
                editable
                events={fcEvents}
                eventClick={(info: EventClickArg) => openEvent(info.event.extendedProps as CalendarEvent)}
                dateClick={handleDateClick}
                eventDrop={handleEventDrop}
                eventResize={handleEventResize}
                headerToolbar={{ left: '', center: '', right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek' }}
                buttonText={{ timeGridDay: 'Day', timeGridWeek: 'Week', dayGridMonth: 'Month', listWeek: 'Agenda' }}
                dayHeaderContent={(arg: DayHeaderContentArg) => (
                  <span className="day-header">
                    <span className="day-header-weekday">{arg.date.toLocaleDateString([], { weekday: 'short' })}</span>
                    <span className="day-header-date">{arg.date.getDate()}</span>
                    {arg.isToday && <span className="day-header-dot" />}
                  </span>
                )}
                eventContent={(info) => (
                  <div className="overflow-hidden px-1 py-0.5 text-xs">
                    <strong className="block truncate">{info.event.title}</strong>
                    <span className="block truncate opacity-80">{(info.event.extendedProps as CalendarEvent).dealerName}</span>
                  </div>
                )}
              />
            </div>
          )}
        </section>

        {/* Rail */}
        <aside className="calendar-event-rail hidden lg:block">
          <div className="calendar-rail-heading">
            <div>
              <h2 className="text-sm font-semibold text-white">Upcoming activity</h2>
              <p className="text-xs text-slate-400">This week</p>
            </div>
            <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-300">{events.length}</span>
          </div>
          {calendar.isLoading ? (
            <div className="space-y-3 p-4">
              <div className="h-20 animate-pulse rounded-xl bg-slate-800" />
              <div className="h-20 animate-pulse rounded-xl bg-slate-800" />
            </div>
          ) : events.length === 0 ? (
            <p className="p-5 text-sm text-slate-400">No activity scheduled this week.</p>
          ) : (
            <div className="calendar-rail-list">
              {events
                .slice()
                .sort((a, b) => a.start.localeCompare(b.start))
                .slice(0, 8)
                .map((e) => (
                  <button
                    type="button"
                    key={e.id}
                    onClick={() => openEvent(e)}
                    className="calendar-rail-event"
                    style={{ borderLeftColor: calendarColors[e.type] ?? calendarColors.request_due }}
                  >
                    <span className="calendar-rail-date">{new Date(e.start).toLocaleDateString([], { day: 'numeric', month: 'short' })}</span>
                    <span className="calendar-rail-event-copy">
                      <strong>{e.title}</strong>
                      <span>{e.dealerName}</span>
                      <small>
                        {new Date(e.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' · '}
                        {activityTypeLabels[e.type] ?? e.type}
                      </small>
                    </span>
                  </button>
                ))}
            </div>
          )}
        </aside>
      </div>

      {/* Narrow-width visits redirect to /mobile/week (see CalendarRoute in
          src/router/routes.tsx) before this component ever mounts — the
          desktop shell above is the only thing rendered here. */}

      {modal?.mode === 'create' && (
        <ActivityModal title="New Calendar Task" onClose={() => setModal(null)}>
          <CalendarActivityForm
            initial={emptyActivityFormValues(modal.date, modal.time)}
            submitting={mutations.create.isPending}
            onCancel={() => setModal(null)}
            onSubmit={(values) =>
              mutations.create.mutate(values, {
                onSuccess: () => { addToast('Task created successfully', 'success'); setModal(null) },
                onError: (e) => addToast(e.message ?? 'Unable to create task.', 'error'),
              })
            }
          />
        </ActivityModal>
      )}

      {modal?.mode === 'details' && (
        <ActivityModal title="Activity Details" onClose={() => setModal(null)}>
          <CalendarActivityDetails activityId={modal.activityId} onClose={() => setModal(null)} />
        </ActivityModal>
      )}
    </div>
  )
}

function ActivityModal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function FilterSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={styles.select}>
        <option value="">All</option>
        {children}
      </select>
    </label>
  )
}

function SummaryItem({ value, label, color, active, onClick }: { value: number; label: string; color: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors',
        active ? 'bg-slate-800' : 'hover:bg-slate-800/60',
      )}
    >
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <strong className="text-white">{value}</strong>
      <span className="text-slate-400">{label}</span>
    </button>
  )
}

function CalendarSkeleton() {
  return <div className="h-[70vh] animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="p-8 text-center">
      <p className="text-sm font-medium text-red-600 dark:text-red-400">Couldn't load the schedule.</p>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Check your connection and try again.</p>
      <button type="button" onClick={onRetry} className="mt-3 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-teal-800">
        Retry
      </button>
    </div>
  )
}

