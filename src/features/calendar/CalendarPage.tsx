import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import listPlugin from '@fullcalendar/list'
import interactionPlugin from '@fullcalendar/interaction'
import type { EventClickArg } from '@fullcalendar/core'
import { ChevronLeft, ChevronRight, CirclePlus, Filter, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { getCalendarData } from '../../api/calendar'
import type { CalendarEvent } from './calendarEventMapper'
import { calendarColors, mapCalendarEvents, activityTypeLabels } from './calendarEventMapper'
import Spinner from '../../components/loaders/Spinner'
import { useBootstrap } from '../../hooks/useBootstrap'

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

const toDateKey = (date: Date) => date.toISOString().slice(0, 10)

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

const dayLabel = (dateKey: string) => {
  const isToday = dateKey === toDateKey(new Date())
  const date = new Date(`${dateKey}T00:00:00`)
  return isToday
    ? `Today · ${date.toLocaleDateString([], { weekday: 'long' })}`
    : date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'short' })
}

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
}

const EMPTY_FILTERS: Filters = {
  staffId: '',
  territoryId: '',
  dealerId: '',
  priority: '',
  visitType: '',
  status: '',
  activityType: '',
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
    return true
  })
}

// Shared style tokens so the same control never drifts between two spellings.
const styles = {
  navButton: 'flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100',
  select: 'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  chip: 'inline-flex items-center gap-1 rounded-full border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-800 dark:border-teal-800 dark:bg-teal-950/50 dark:text-teal-300',
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CalendarPage() {
  const nav = useNavigate()
  const bootstrap = useBootstrap()
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [selectedDate, setSelectedDate] = useState(toDateKey(new Date()))
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

  const range = { start: toDateKey(weekStart), end: toDateKey(addDays(weekStart, 7)) }
  const calendar = useQuery({
    queryKey: ['calendar', range.start, range.end],
    queryFn: () => getCalendarData(range.start, range.end),
    refetchOnWindowFocus: true,
  })

  const allEvents = useMemo(() => mapCalendarEvents(calendar.data ?? { requests: [], visits: [] }), [calendar.data])
  const events = useMemo(() => applyFilters(allEvents, filters), [allEvents, filters])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart])

  const activeFilterEntries = Object.entries(filters).filter(([, v]) => v)

  const goToday = () => {
    setWeekStart(startOfWeek(new Date()))
    setSelectedDate(toDateKey(new Date()))
  }
  const moveWeek = (n: number) => {
    const next = addDays(weekStart, n * 7)
    setWeekStart(next)
    setSelectedDate(toDateKey(next))
  }
  const openEvent = (e: CalendarEvent) => nav(e.visitId ? `/visits/${e.visitId}` : `/requests/${e.requestId}`)
  const clearFilter = (key: keyof Filters) => setFilters((f) => ({ ...f, [key]: '' }))

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
    return value
  }

  const fcEvents = events.map((e) => ({
    ...e,
    backgroundColor: calendarColors[e.type] ?? calendarColors.request_due,
    borderColor: calendarColors[e.type] ?? calendarColors.request_due,
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
              <SummaryItem value={events.filter((e) => e.type === 'dealer_visit').length} label="Visits" color={calendarColors.dealer_visit} />
              <SummaryItem value={events.filter((e) => e.type === 'escalation' || e.type === 'p1_request').length} label="P1 / Escalation" color={calendarColors.escalation} />
              <SummaryItem value={events.filter((e) => e.type === 'request_due').length} label="Due" color={calendarColors.request_due} />
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
              events={fcEvents}
              eventClick={(info: EventClickArg) => openEvent(info.event.extendedProps as CalendarEvent)}
              headerToolbar={{ left: '', center: '', right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek' }}
              buttonText={{ timeGridDay: 'Day', timeGridWeek: 'Week', dayGridMonth: 'Month', listWeek: 'Agenda' }}
              eventContent={(info) => (
                <div className="overflow-hidden px-1 py-0.5 text-xs">
                  <strong className="block truncate">{info.event.title}</strong>
                  <span className="block truncate opacity-80">{(info.event.extendedProps as CalendarEvent).dealerName}</span>
                </div>
              )}
            />
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

      {/* ------------------------------------------------------------ */}
      {/* Mobile                                                        */}
      {/* ------------------------------------------------------------ */}
      <section className="calendar-mobile md:hidden">
        <MobileCalendar
          weekStart={weekStart}
          selectedDate={selectedDate}
          days={days}
          events={events}
          loading={calendar.isLoading}
          error={calendar.isError}
          onRetry={() => calendar.refetch()}
          onMove={moveWeek}
          onToday={goToday}
          onSelect={setSelectedDate}
          onOpen={openEvent}
        />
      </section>
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

function SummaryItem({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <strong className="text-white">{value}</strong>
      <span className="text-slate-400">{label}</span>
    </div>
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

// ---------------------------------------------------------------------------
// Mobile
// ---------------------------------------------------------------------------

function MobileCalendar({
  weekStart,
  selectedDate,
  days,
  events,
  loading,
  error,
  onRetry,
  onMove,
  onToday,
  onSelect,
  onOpen,
}: {
  weekStart: Date
  selectedDate: string
  days: Date[]
  events: CalendarEvent[]
  loading: boolean
  error: boolean
  onRetry: () => void
  onMove: (n: number) => void
  onToday: () => void
  onSelect: (d: string) => void
  onOpen: (e: CalendarEvent) => void
}) {
  const dayEvents = events.filter((e) => e.start.slice(0, 10) === selectedDate).sort((a, b) => a.start.localeCompare(b.start))
  const isCurrentWeek = toDateKey(startOfWeek(new Date())) === toDateKey(weekStart)

  return (
    <div className="calendar-mobile-shell min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-gradient-to-b from-slate-900 to-slate-950 px-5 pb-5 pt-6 text-white shadow-lg">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-lg font-bold">Field schedule</h1>
            <p className="text-sm text-slate-400">{weekLabel(weekStart)}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {!isCurrentWeek && (
              <button type="button" onClick={onToday} className="rounded-lg bg-white/10 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/15">
                Today
              </button>
            )}
            <button type="button" aria-label="Previous week" onClick={() => onMove(-1)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/15">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button type="button" aria-label="Next week" onClick={() => onMove(1)} className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 transition-colors hover:bg-white/15">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Week strip */}
      <div className="sticky top-[76px] z-10 grid grid-cols-7 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        {days.map((day) => {
          const key = toDateKey(day)
          const dayEventsForKey = events.filter((e) => e.start.slice(0, 10) === key)
          const count = dayEventsForKey.length
          const visits = dayEventsForKey.filter((e) => e.type === 'dealer_visit').length
          const urgent = dayEventsForKey.filter((e) => e.type === 'p1_request' || e.type === 'escalation').length
          const selected = selectedDate === key
          const today = key === toDateKey(new Date())

          return (
            <button
              type="button"
              key={key}
              aria-current={selected ? 'date' : undefined}
              onClick={() => onSelect(key)}
              className={cn(
                'flex flex-col items-center border-r border-slate-100 px-1.5 py-3 transition-colors duration-150 last:border-0 dark:border-slate-800',
                selected
                  ? 'bg-teal-600 text-white'
                  : today
                    ? 'bg-teal-50 text-teal-900 dark:bg-teal-950/40 dark:text-teal-100'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800/50',
              )}
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">{day.toLocaleDateString([], { weekday: 'short' }).slice(0, 3)}</span>
              <strong className="mt-2 text-lg leading-none">{day.getDate()}</strong>
              <span className="mt-2 flex min-h-[6px] gap-1">
                {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                  <i
                    key={i}
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      selected ? 'bg-white/80' : i < visits ? 'bg-teal-600 dark:bg-teal-400' : i < visits + urgent ? 'bg-red-500' : 'bg-slate-300 dark:bg-slate-600',
                    )}
                  />
                ))}
              </span>
              <span className={cn('mt-1 text-[9px] font-bold', selected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500', count === 0 && 'invisible')}>
                {count || 0}
              </span>
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-5 border-b border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
        <Legend color="bg-teal-600" label="Visits" />
        <Legend color="bg-red-500" label="P1 / Escalation" />
        <Legend color="bg-slate-300 dark:bg-slate-600" label="Other" />
      </div>

      {/* Day activities */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <ErrorState onRetry={onRetry} />
      ) : (
        <section className="space-y-3 p-5 pb-28">
          <p className="px-1 text-xs font-bold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">{dayLabel(selectedDate)}</p>

          {dayEvents.length === 0 ? (
            <div className="py-16 text-center">
              <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <CirclePlus className="h-8 w-8 text-slate-400" />
              </div>
              <p className="font-semibold text-slate-800 dark:text-slate-200">No activities scheduled</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">You're clear for this day.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {dayEvents.map((e) => {
                const color = calendarColors[e.type] ?? calendarColors.request_due
                const start = new Date(e.start)
                const end = new Date(start.getTime() + 60 * 60 * 1000)
                return (
                  <button
                    type="button"
                    key={e.id}
                    onClick={() => onOpen(e)}
                    className="flex w-full items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-4 text-left transition-all active:scale-[0.98] dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="flex w-12 shrink-0 flex-col items-center pt-0.5">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="mt-2 h-3 w-3 rounded-full" style={{ background: color }} />
                      <span className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">{end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <strong className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{e.title}</strong>
                      <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-400">{e.dealerName}</span>
                      <span className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                        {activityTypeLabels[e.type] ?? e.type}
                        {e.ownerName ? ` · ${e.ownerName}` : ''}
                      </span>
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                  </button>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <i className={cn('h-2 w-2 rounded-full', color)} />
      <span>{label}</span>
    </span>
  )
}
