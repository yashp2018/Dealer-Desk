import { useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'

import { getCalendarData } from '../../api/calendar'
import {
  mapCalendarEvents,
  calendarColors,
  activityTypeLabels,
} from './calendarEventMapper'
import type { CalendarEvent } from './calendarEventMapper'
import Spinner from '../../components/loaders/Spinner'

const HOUR_START = 8
const HOUR_END = 20
const HOUR_HEIGHT = 68

const toKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const addDays = (date: Date, amount: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

const startOfWeek = (date: Date) => {
  const result = new Date(date)
  const day = result.getDay()
  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1))
  result.setHours(0, 0, 0, 0)
  return result
}

const parseDate = (value?: string | null) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const eventDateKey = (value?: string | null) => {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value

  const date = parseDate(value)
  if (!date) return value.slice(0, 10)

  return toKey(date)
}

const formatTime = (value?: string | null) => {
  const date = parseDate(value)
  if (!date) return 'Time not set'

  return date.toLocaleTimeString([], {
    hour: 'numeric',
    minute: '2-digit',
  })
}

const formatHour = (hour: number) => {
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const display = hour % 12 || 12
  return `${display}:00 ${suffix}`
}

const formatWeek = (date: Date) =>
  `${date.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })} – ${addDays(date, 6).toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })}`

const getEventTop = (event: CalendarEvent) => {
  const date = parseDate(event.start)
  if (!date) return 0

  const minutes = date.getHours() * 60 + date.getMinutes()
  return Math.max(
    0,
    ((minutes - HOUR_START * 60) / 60) * HOUR_HEIGHT,
  )
}

const getEventHeight = (event: CalendarEvent) => {
  const start = parseDate(event.start)

  // The existing CalendarEvent contract does not guarantee an end time.
  // Keep cards readable until the backend exposes a real duration.
  if (!start) return HOUR_HEIGHT - 8

  return HOUR_HEIGHT - 8
}

const eventHref = (event: CalendarEvent) => {
  if (event.visitId) return `/visits/${event.visitId}`
  if (event.requestId) return `/requests/${event.requestId}`
  return null
}

const eventKind = (event: CalendarEvent) => {
  if (event.type === 'dealer_visit') return 'Dealer Visit'
  if (event.type === 'p1_request') return 'P1 Request'
  if (event.type === 'escalation') return 'Escalation'
  return activityTypeLabels[event.type] ?? event.type
}

const eventIcon = (event: CalendarEvent) => {
  if (event.type === 'dealer_visit') return '●'
  if (event.type === 'p1_request' || event.type === 'escalation') return '!'
  return '•'
}

export default function MobilePlanningPage() {
  const todayKey = toKey(new Date())

  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date()),
  )
  const [selectedDate, setSelectedDate] = useState(todayKey)
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const start = toKey(weekStart)
  const end = toKey(addDays(weekStart, 7))

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['calendar', start, end],
    queryFn: () => getCalendarData(start, end),
    refetchOnWindowFocus: true,
    staleTime: 30_000,
  })

  const events = useMemo(
    () =>
      mapCalendarEvents(
        data ?? {
          requests: [],
          visits: [],
        },
      ),
    [data],
  )

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) =>
        addDays(weekStart, index),
      ),
    [weekStart],
  )

  const filteredEvents = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return events

    return events.filter((event) =>
      [
        event.title,
        event.dealerName,
        event.ownerName,
        event.status,
        activityTypeLabels[event.type],
        eventKind(event),
      ].some((value) =>
        String(value ?? '').toLowerCase().includes(query),
      ),
    )
  }, [events, search])

  const eventsByDate = useMemo(() => {
    const grouped = new Map<string, CalendarEvent[]>()

    for (const event of filteredEvents) {
      const key = eventDateKey(event.start)
      if (!key) continue

      const list = grouped.get(key) ?? []
      list.push(event)
      grouped.set(key, list)
    }

    for (const list of grouped.values()) {
      list.sort(
        (a, b) =>
          (parseDate(a.start)?.getTime() ?? 0) -
          (parseDate(b.start)?.getTime() ?? 0),
      )
    }

    return grouped
  }, [filteredEvents])

  const selectedEvents = eventsByDate.get(selectedDate) ?? []

  const summary = useMemo(() => {
    const result = {
      total: selectedEvents.length,
      visits: 0,
      requests: 0,
      priority: 0,
      overdue: 0,
    }

    for (const event of selectedEvents) {
      if (event.type === 'dealer_visit') result.visits += 1
      else result.requests += 1

      if (
        event.type === 'p1_request' ||
        event.type === 'escalation'
      ) {
        result.priority += 1
      }

      if (event.type === 'escalation') result.overdue += 1
    }

    return result
  }, [selectedEvents])

  const moveWeek = (amount: number) => {
    const next = addDays(weekStart, amount * 7)
    setWeekStart(next)
    setSelectedDate(toKey(next))
  }

  const goToday = () => {
    const today = new Date()
    setWeekStart(startOfWeek(today))
    setSelectedDate(toKey(today))
  }

  const selectedDateObject = new Date(`${selectedDate}T12:00:00`)

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-slate-950 dark:text-white">
      {/* Compact mobile header */}
      <header className="sticky top-0 z-40 bg-slate-950 px-4 pb-3 pt-4 text-white shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-300">
            <CalendarDays className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-teal-300">
              Planning
            </p>
            <h1 className="truncate text-lg font-bold leading-tight">
              Calendar
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setShowSearch((value) => !value)}
            aria-label="Search calendar"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"
          >
            {showSearch ? (
              <X className="h-4 w-4" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowFilters(true)}
            aria-label="Filter calendar"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10"
          >
            <Filter className="h-4 w-4" />
          </button>

          <Link
            to="/mobile/capture"
            aria-label="Add activity"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-600"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>

        {showSearch && (
          <div className="mt-3">
            <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-slate-900">
              <Search className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search dealer, request, visit..."
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="text-slate-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Week navigation */}
      <section className="sticky top-[61px] z-30 border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-12 items-center gap-2 px-3">
          <button
            type="button"
            onClick={() => moveWeek(-1)}
            aria-label="Previous week"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="text-xs font-bold">{formatWeek(weekStart)}</p>
          </div>

          <button
            type="button"
            onClick={() => moveWeek(1)}
            aria-label="Next week"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={goToday}
            className="h-8 rounded-lg bg-slate-100 px-2.5 text-[10px] font-bold dark:bg-slate-800"
          >
            Today
          </button>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Refresh"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${
                isFetching ? 'animate-spin' : ''
              }`}
            />
          </button>
        </div>

        {/* Mobile week selector — NO DOTS */}
        <div className="grid grid-cols-7 border-t border-slate-100 dark:border-slate-800">
          {days.map((day) => {
            const key = toKey(day)
            const count = eventsByDate.get(key)?.length ?? 0
            const selected = key === selectedDate
            const today = key === todayKey

            return (
              <button
                type="button"
                key={key}
                onClick={() => setSelectedDate(key)}
                className={[
                  'relative flex min-w-0 flex-col items-center border-r border-slate-100 py-2.5 last:border-r-0 dark:border-slate-800',
                  selected
                    ? 'bg-teal-600 text-white'
                    : 'bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300',
                ].join(' ')}
              >
                <span className="text-[8px] font-bold uppercase">
                  {day.toLocaleDateString([], {
                    weekday: 'short',
                  })}
                </span>

                <span
                  className={[
                    'mt-1 flex h-8 w-8 items-center justify-center rounded-full text-base font-bold',
                    today && !selected
                      ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-500 dark:bg-teal-950 dark:text-teal-300'
                      : '',
                  ].join(' ')}
                >
                  {day.getDate()}
                </span>

                <span
                  className={[
                    'mt-1 text-[8px] font-semibold',
                    selected
                      ? 'text-white/80'
                      : 'text-slate-400',
                  ].join(' ')}
                >
                  {count} {count === 1 ? 'event' : 'events'}
                </span>
              </button>
            )
          })}
        </div>
      </section>

      {isLoading ? (
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : isError ? (
        <div className="m-4 rounded-2xl border border-red-200 bg-red-50 p-5 dark:border-red-900 dark:bg-red-950/30">
          <p className="text-sm font-bold text-red-800 dark:text-red-200">
            Unable to load calendar
          </p>
          <p className="mt-1 text-xs text-red-700 dark:text-red-300">
            Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-4 rounded-xl bg-red-600 px-4 py-2.5 text-xs font-bold text-white"
          >
            Try again
          </button>
        </div>
      ) : (
        <main className="pb-28">
          {/* Selected day summary */}
          <section className="bg-white px-4 py-3 dark:bg-slate-900">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-teal-600">
                  {selectedDate === todayKey ? 'Today' : 'Selected day'}
                </p>
                <h2 className="mt-0.5 text-base font-bold">
                  {selectedDateObject.toLocaleDateString([], {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </h2>
              </div>

              <span className="text-xs font-semibold text-slate-400">
                {summary.total} events
              </span>
            </div>

            <div className="mt-3 grid grid-cols-4 gap-2">
              {[
                ['Visits', summary.visits],
                ['Requests', summary.requests],
                ['P1', summary.priority],
                ['Overdue', summary.overdue],
              ].map(([label, value]) => (
                <div
                  key={String(label)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-1 py-2 text-center dark:border-slate-800 dark:bg-slate-800/60"
                >
                  <p className="text-sm font-bold">{value}</p>
                  <p className="mt-0.5 text-[8px] font-bold uppercase tracking-wide text-slate-400">
                    {label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* TRUE MOBILE DAY CALENDAR */}
          <section className="mt-2 overflow-hidden border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <div className="flex">
              {/* Time column */}
              <div className="w-[58px] shrink-0 border-r border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
                <div
                  className="border-b border-slate-200 dark:border-slate-800"
                  style={{ height: 36 }}
                />

                {Array.from(
                  { length: HOUR_END - HOUR_START },
                  (_, index) => {
                    const hour = HOUR_START + index

                    return (
                      <div
                        key={hour}
                        className="relative border-b border-slate-100 dark:border-slate-800"
                        style={{ height: HOUR_HEIGHT }}
                      >
                        <span className="absolute -top-2 right-2 text-[9px] font-semibold text-slate-400">
                          {formatHour(hour)}
                        </span>
                      </div>
                    )
                  },
                )}
              </div>

              {/* ONE selected-day column */}
              <div className="min-w-0 flex-1">
                <div
                  className={[
                    'border-b border-slate-200 px-3 dark:border-slate-800',
                    selectedDate === todayKey
                      ? 'bg-teal-50/70 dark:bg-teal-950/20'
                      : 'bg-slate-50 dark:bg-slate-950',
                  ].join(' ')}
                  style={{ height: 36 }}
                >
                  <div className="flex h-full items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                      {selectedDateObject.toLocaleDateString([], {
                        weekday: 'short',
                      })}
                      {' '}
                      {selectedDateObject.getDate()}
                    </span>

                    <span className="text-[9px] font-semibold text-slate-400">
                      {summary.total} events
                    </span>
                  </div>
                </div>

                <div
                  className="relative"
                  style={{
                    height:
                      (HOUR_END - HOUR_START) * HOUR_HEIGHT,
                  }}
                >
                  {/* Hour lines */}
                  {Array.from(
                    { length: HOUR_END - HOUR_START },
                    (_, index) => (
                      <div
                        key={index}
                        className="absolute left-0 right-0 border-b border-slate-100 dark:border-slate-800"
                        style={{
                          top: index * HOUR_HEIGHT,
                          height: HOUR_HEIGHT,
                        }}
                      />
                    ),
                  )}

                  {/* Current day indicator */}
                  {selectedDate === todayKey && (
                    <div
                      className="pointer-events-none absolute left-0 right-0 z-10 border-t-2 border-teal-500"
                      style={{
                        top: (() => {
                          const now = new Date()
                          const minutes =
                            now.getHours() * 60 + now.getMinutes()

                          return Math.max(
                            0,
                            Math.min(
                              (HOUR_END - HOUR_START) *
                                HOUR_HEIGHT,
                              ((minutes -
                                HOUR_START * 60) /
                                60) *
                                HOUR_HEIGHT,
                            ),
                          )
                        })(),
                      }}
                    >
                      <span className="absolute -left-1 -top-[5px] h-2 w-2 rounded-full bg-teal-500" />
                    </div>
                  )}

                  {/* Real calendar cards */}
                  {selectedEvents.map((event) => {
                    const color =
                      calendarColors[event.type] ??
                      calendarColors.request_due

                    const top = getEventTop(event)
                    const height = getEventHeight(event)
                    const href = eventHref(event)

                    const card = (
                      <div
                        className="absolute left-2 right-2 overflow-hidden rounded-xl border bg-white p-2.5 shadow-sm dark:bg-slate-900"
                        style={{
                          top,
                          height,
                          borderColor: `${color}55`,
                          backgroundColor: `${color}12`,
                          borderLeftWidth: 4,
                          borderLeftColor: color,
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <span
                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[10px] font-black text-white"
                            style={{ backgroundColor: color }}
                          >
                            {eventIcon(event)}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate text-[9px] font-bold uppercase"
                              style={{ color }}
                            >
                              {eventKind(event)}
                            </p>

                            <p className="mt-0.5 truncate text-sm font-bold text-slate-900 dark:text-white">
                              {event.title || 'Activity'}
                            </p>

                            {event.dealerName && (
                              <p className="mt-0.5 truncate text-[10px] text-slate-600 dark:text-slate-400">
                                {event.dealerName}
                              </p>
                            )}

                            <p className="mt-1 text-[9px] font-semibold text-slate-500 dark:text-slate-400">
                              {formatTime(event.start)}
                              {event.priority
                                ? ` · P${event.priority}`
                                : ''}
                            </p>
                          </div>

                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                        </div>

                        {event.status && (
                          <span className="mt-2 inline-block max-w-full truncate rounded-full bg-white/70 px-2 py-1 text-[8px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                            {event.status}
                          </span>
                        )}

                        {event.type === 'escalation' && (
                          <span className="ml-1 rounded-full bg-amber-100 px-2 py-1 text-[8px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Overdue
                          </span>
                        )}
                      </div>
                    )

                    return href ? (
                      <Link
                        key={event.id}
                        to={href}
                        className="absolute inset-x-0 block"
                        style={{
                          top,
                          height,
                        }}
                      >
                        {card}
                      </Link>
                    ) : (
                      <div
                        key={event.id}
                        className="absolute inset-x-0"
                        style={{
                          top,
                          height,
                        }}
                      >
                        {card}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {selectedEvents.length === 0 && (
              <div className="border-t border-dashed border-slate-200 px-4 py-8 text-center dark:border-slate-800">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  No activities scheduled
                </p>
                <p className="mt-1 text-[10px] text-slate-400">
                  This day is clear.
                </p>
                <Link
                  to="/mobile/capture"
                  className="mt-4 inline-flex rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white"
                >
                  <Plus className="mr-1.5 h-4 w-4" />
                  Create request
                </Link>
              </div>
            )}
          </section>

          {/* Event list — useful when several cards overlap */}
          {selectedEvents.length > 0 && (
            <section className="px-3 pt-3">
              <div className="mb-2 flex items-center justify-between px-1">
                <h3 className="text-xs font-bold">
                  Day schedule
                </h3>
                <span className="text-[9px] font-semibold text-slate-400">
                  Tap an event for details
                </span>
              </div>

              <div className="space-y-2">
                {selectedEvents.map((event) => {
                  const color =
                    calendarColors[event.type] ??
                    calendarColors.request_due
                  const href = eventHref(event)

                  const row = (
                    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                      <div
                        className="h-10 w-1 shrink-0 rounded-full"
                        style={{ backgroundColor: color }}
                      />

                      <div className="w-14 shrink-0">
                        <p className="text-[10px] font-bold text-slate-500">
                          {formatTime(event.start)}
                        </p>
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold">
                          {event.title || 'Activity'}
                        </p>
                        <p className="mt-0.5 truncate text-[10px] text-slate-500">
                          {event.dealerName || eventKind(event)}
                        </p>
                      </div>

                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                    </div>
                  )

                  return href ? (
                    <Link key={event.id} to={href}>
                      {row}
                    </Link>
                  ) : (
                    <div key={event.id}>{row}</div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Legend — square blocks, no dots */}
          <div className="flex flex-wrap gap-2 px-3 py-4">
            {[
              ['Dealer Visit', 'bg-teal-500'],
              ['Request', 'bg-blue-500'],
              ['P1 / Escalation', 'bg-red-500'],
              ['Follow-up', 'bg-purple-500'],
              ['Overdue', 'bg-amber-500'],
            ].map(([label, tone]) => (
              <span
                key={label}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[9px] font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
              >
                <i className={`h-2 w-2 rounded-sm ${tone}`} />
                {label}
              </span>
            ))}
          </div>
        </main>
      )}

      {/* Mobile filter sheet */}
      {showFilters && (
        <div className="fixed inset-0 z-[60] flex items-end bg-slate-950/50">
          <div className="w-full rounded-t-3xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-teal-600">
                  Calendar
                </p>
                <h3 className="text-lg font-bold">Filters</h3>
              </div>

              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800"
                aria-label="Close filters"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Search is available above. Additional event filters
              should be connected to the real backend filter fields
              before adding fake filter values.
            </p>

            <button
              type="button"
              onClick={() => setShowFilters(false)}
              className="mt-5 w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Floating action */}
      <Link
        to="/mobile/capture"
        aria-label="Create activity"
        className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-teal-600 text-white shadow-xl"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}
