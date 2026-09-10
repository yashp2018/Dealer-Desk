import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  MapPin,
  Plus,
  RefreshCw,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'

import { getQueue } from '../../api/myDay'
import { useVisits } from '../../hooks/useVisits'
import Spinner from '../../components/loaders/Spinner'

/**
 * Returns Monday 00:00:00 for the week containing the supplied date.
 */
const startOfWeek = (date: Date) => {
  const result = new Date(date)
  const day = result.getDay()

  result.setDate(
    result.getDate() - (day === 0 ? 6 : day - 1),
  )

  result.setHours(0, 0, 0, 0)

  return result
}

/**
 * Create a local YYYY-MM-DD key.
 *
 * Do not use:
 * date.toISOString().slice(0, 10)
 *
 * because UTC conversion can move the date to the
 * previous/next calendar day for some timezones.
 */
const keyOf = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * Safely format an API datetime.
 */
const formatTime = (value?: string | null) => {
  if (!value) {
    return 'Time not set'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Time not set'
  }

  return date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MobileWeekPage() {
  /**
   * Current displayed week.
   */
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date()),
  )

  /**
   * Selected day.
   *
   * Start with today so the user immediately sees
   * today's activities.
   */
  const today = keyOf(new Date())

  const [selectedDate, setSelectedDate] = useState(today)

  /** 
   * Requests / My Day queue.
   */
  const queue = useQuery({
    queryKey: ['queue'],
    queryFn: getQueue,
  })

  /**
   * Visits.
   */
  const visits = useVisits()

  /**
   * Build the seven days of the displayed week.
   */
  const days = useMemo(() => {
    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(weekStart)

      day.setDate(day.getDate() + index)

      return day
    })
  }, [weekStart])

  /**
   * Calculate daily activity counts.
   */
  const counts = useMemo(() => {
    const requests = queue.data?.requests ?? []
    const visitList = visits.data ?? []

    return days.map((day) => {
      const date = keyOf(day)

      const dayRequests = requests.filter(
        (request) =>
          request.scheduled_at?.slice(0, 10) === date,
      )

      const dayVisits = visitList.filter(
        (visit) =>
          visit.scheduled_at?.slice(0, 10) === date,
      )

      const p1 = dayRequests.filter(
        (request) => request.priority === 1,
      ).length

      return {
        date,
        requestCount: dayRequests.length,
        visitCount: dayVisits.length,
        p1,
        total: dayRequests.length + dayVisits.length,
      }
    })
  }, [days, queue.data, visits.data])

  /**
   * Selected day information.
   */
  const selectedDay = counts.find(
    (day) => day.date === selectedDate,
  )

  /**
   * Requests for selected date.
   */
  const selectedRequests = useMemo(() => {
    return (queue.data?.requests ?? []).filter(
      (request) =>
        request.scheduled_at?.slice(0, 10) === selectedDate,
    )
  }, [queue.data, selectedDate])

  /**
   * Visits for selected date.
   */
  const selectedVisits = useMemo(() => {
    return (visits.data ?? []).filter(
      (visit) =>
        visit.scheduled_at?.slice(0, 10) === selectedDate,
    )
  }, [visits.data, selectedDate])

  /**
   * Convert requests and visits into a single
   * chronological activity feed.
   */
  const activities = useMemo(() => {
    const requestActivities = selectedRequests.map(
      (request) => ({
        id: `request-${request.id}`,
        type: 'request' as const,
        time: request.scheduled_at,

        /**
         * Request type from the actual Request interface.
         *
         * `subject` does not exist in this project.
         */
        title: request.title || 'Request',

        subtitle:
          request.dealer_name || 'Dealer request',

        priority: request.priority,

        href: `/requests/${request.id}`,
      }),
    )

    const visitActivities = selectedVisits.map(
      (visit) => ({
        id: `visit-${visit.id}`,
        type: 'visit' as const,
        time: visit.scheduled_at,

        title:
          visit.dealer_name || 'Dealer Visit',

        /**
         * The existing Visit interface uses `visit_type`.
         */
        subtitle:
          visit.visit_type || 'Scheduled visit',

        priority: undefined,

        href: `/visits/${visit.id}`,
      }),
    )

    return [
      ...requestActivities,
      ...visitActivities,
    ].sort((a, b) => {
      if (!a.time) {
        return 1
      }

      if (!b.time) {
        return -1
      }

      return (
        new Date(a.time).getTime() -
        new Date(b.time).getTime()
      )
    })
  }, [selectedRequests, selectedVisits])

  /**
   * Selected date label.
   */
  const selectedDateObject = new Date(
    `${selectedDate}T12:00:00`,
  )

  const selectedDayLabel =
    selectedDateObject.toLocaleDateString([], {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
    })

  /**
   * Week label.
   */
  const weekEnd = days[6]

  const weekLabel = `${weekStart.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })} – ${weekEnd.toLocaleDateString([], {
    day: 'numeric',
    month: 'short',
  })}`

  /**
   * Go to previous week.
   */
  const goPreviousWeek = () => {
    const nextWeek = new Date(weekStart)

    nextWeek.setDate(nextWeek.getDate() - 7)

    setWeekStart(nextWeek)

    /**
     * Select Monday of the newly displayed week.
     */
    setSelectedDate(keyOf(nextWeek))
  }

  /**
   * Go to next week.
   */
  const goNextWeek = () => {
    const nextWeek = new Date(weekStart)

    nextWeek.setDate(nextWeek.getDate() + 7)

    setWeekStart(nextWeek)

    /**
     * Select Monday of the newly displayed week.
     */
    setSelectedDate(keyOf(nextWeek))
  }

  /**
   * Return to current week and today.
   */
  const goToday = () => {
    const currentWeek = startOfWeek(new Date())

    setWeekStart(currentWeek)
    setSelectedDate(today)
  }

  /**
   * Loading state.
   */
  if (queue.isLoading || visits.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Spinner size="lg" />
      </div>
    )
  }

  /**
   * Error state.
   */
  if (queue.isError || visits.isError) {
    return (
      <div className="min-h-screen bg-slate-50 p-5 dark:bg-slate-950">
        <div className="mx-auto max-w-lg rounded-2xl border border-red-200 bg-red-50 p-6 dark:border-red-900 dark:bg-red-950/30">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>

            <div>
              <p className="text-sm font-bold text-red-800 dark:text-red-200">
                Unable to load weekly planning
              </p>

              <p className="mt-1 text-xs leading-5 text-red-700 dark:text-red-300">
                Please check your connection and try again.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              void queue.refetch()
              void visits.refetch()
            }}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 active:scale-[0.99]"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 dark:bg-slate-950">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950 text-white shadow-lg">
        <div className="px-4 pb-4 pt-5">
          {/* Title row */}
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-teal-400" />

                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-teal-300">
                  Planning
                </span>
              </div>

              <h1 className="mt-1 text-xl font-extrabold tracking-tight">
                Weekly Calendar
              </h1>
            </div>

            <button
              type="button"
              onClick={goToday}
              className="shrink-0 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-white/15 active:scale-95"
            >
              Today
            </button>
          </div>

          {/* Week navigation */}
          <div className="mt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={goPreviousWeek}
              aria-label="Previous week"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/15 active:scale-95"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 text-center">
              <p className="text-sm font-bold">
                {weekLabel}
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Select a day
              </p>
            </div>

            <button
              type="button"
              onClick={goNextWeek}
              aria-label="Next week"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 transition hover:bg-white/15 active:scale-95"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================
          WEEK STRIP
      ====================================================== */}
      <section className="border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="grid grid-cols-7 gap-1.5">
          {counts.map((day) => {
            const dayDate = new Date(
              `${day.date}T12:00:00`,
            )

            const isToday = day.date === today
            const isSelected =
              day.date === selectedDate

            const dayName =
              dayDate
                .toLocaleDateString([], {
                  weekday: 'short',
                })
                .slice(0, 3)

            const dayNumber = dayDate.getDate()

            return (
              <button
                key={day.date}
                type="button"
                onClick={() =>
                  setSelectedDate(day.date)
                }
                aria-label={`${dayName} ${dayNumber}, ${day.total} activities`}
                aria-current={
                  isToday ? 'date' : undefined
                }
                className={`
                  relative flex min-h-[82px] flex-col items-center rounded-2xl border px-1 py-2.5 transition-all
                  active:scale-[0.97]
                  ${
                    isSelected
                      ? 'border-teal-600 bg-teal-600 text-white shadow-md shadow-teal-600/20'
                      : isToday
                        ? 'border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/40'
                        : 'border-transparent bg-slate-50 hover:border-slate-200 dark:bg-slate-800/70 dark:hover:border-slate-700'
                  }
                `}
              >
                {/* Day name */}
                <span
                  className={`
                    text-[10px] font-bold uppercase
                    ${
                      isSelected
                        ? 'text-teal-100'
                        : isToday
                          ? 'text-teal-700 dark:text-teal-300'
                          : 'text-slate-500 dark:text-slate-400'
                    }
                  `}
                >
                  {dayName}
                </span>

                {/* Day number */}
                <span
                  className={`
                    mt-1 text-xl font-extrabold leading-none
                    ${
                      isSelected
                        ? 'text-white'
                        : 'text-slate-900 dark:text-white'
                    }
                  `}
                >
                  {dayNumber}
                </span>

                {/* Activity indicators */}
                <div className="mt-3 flex min-h-2.5 items-center gap-1">
                  {/* Visits */}
                  {day.visitCount > 0 && (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isSelected
                          ? 'bg-white'
                          : 'bg-teal-500'
                      }`}
                    />
                  )}

                  {/* P1 */}
                  {day.p1 > 0 && (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isSelected
                          ? 'bg-red-200'
                          : 'bg-red-500'
                      }`}
                    />
                  )}

                  {/* Other requests */}
                  {day.requestCount - day.p1 > 0 && (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isSelected
                          ? 'bg-teal-200'
                          : 'bg-slate-400'
                      }`}
                    />
                  )}
                </div>

                {/* Count */}
                {day.total > 0 && (
                  <span
                    className={`
                      mt-1 text-[9px] font-bold
                      ${
                        isSelected
                          ? 'text-teal-100'
                          : 'text-slate-400 dark:text-slate-500'
                      }
                    `}
                  >
                    {day.total}{' '}
                    {day.total === 1
                      ? 'item'
                      : 'items'}
                  </span>
                )}

                {/* Today indicator */}
                {isToday && !isSelected && (
                  <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-teal-600 dark:bg-teal-400" />
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* =====================================================
          LEGEND
      ====================================================== */}
      <section className="flex items-center justify-center gap-5 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-teal-500" />

          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Visit
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-red-500" />

          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            P1
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-slate-400" />

          <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
            Request
          </span>
        </div>
      </section>

      {/* =====================================================
          SELECTED DAY HEADER
      ====================================================== */}
      <main className="px-4 pt-5">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-teal-600 dark:text-teal-400">
              Selected day
            </p>

            <h2 className="mt-1 truncate text-xl font-extrabold text-slate-900 dark:text-white">
              {selectedDayLabel}
            </h2>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-lg font-extrabold text-slate-900 dark:text-white">
              {selectedDay?.total ?? 0}
            </p>

            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              activities
            </p>
          </div>
        </div>

        {/* ===================================================
            ACTIVITY LIST
        ==================================================== */}
        {activities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <CalendarDays className="h-5 w-5 text-slate-400" />
            </div>

            <h3 className="mt-3 text-sm font-bold text-slate-800 dark:text-slate-200">
              No activities scheduled
            </h3>

            <p className="mx-auto mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">
              There are no visits or scheduled requests
              for this day.
            </p>

            <Link
              to="/mobile/capture"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-teal-700 active:scale-95"
            >
              <Plus className="h-4 w-4" />
              Create Activity
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            {activities.map(
              (activity, index) => {
                const isVisit =
                  activity.type === 'visit'

                const isP1 =
                  activity.priority === 1

                const isLast =
                  index === activities.length - 1

                return (
                  <Link
                    key={activity.id}
                    to={activity.href}
                    className={`
                      flex gap-3 px-4 py-4 transition
                      hover:bg-slate-50
                      dark:hover:bg-slate-800/60
                      active:bg-slate-100
                      dark:active:bg-slate-800
                      ${
                        !isLast
                          ? 'border-b border-slate-100 dark:border-slate-800'
                          : ''
                      }
                    `}
                  >
                    {/* Time */}
                    <div className="w-14 shrink-0 pt-0.5 text-right">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        {formatTime(
                          activity.time,
                        )}
                      </p>
                    </div>

                    {/* Timeline */}
                    <div className="relative flex w-4 shrink-0 justify-center">
                      {!isLast && (
                        <span className="absolute top-3 h-full w-px bg-slate-200 dark:bg-slate-700" />
                      )}

                      <span
                        className={`
                          relative z-10 mt-0.5 h-3 w-3 rounded-full ring-4 ring-white dark:ring-slate-900
                          ${
                            isP1
                              ? 'bg-red-500'
                              : isVisit
                                ? 'bg-teal-500'
                                : 'bg-slate-400'
                          }
                        `}
                      />
                    </div>

                    {/* Activity */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          {/* Type badge */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`
                                inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[9px] font-extrabold uppercase
                                ${
                                  isP1
                                    ? 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400'
                                    : isVisit
                                      ? 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300'
                                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                }
                              `}
                            >
                              {isVisit ? (
                                <MapPin className="h-2.5 w-2.5" />
                              ) : (
                                <ClipboardList className="h-2.5 w-2.5" />
                              )}

                              {isP1
                                ? 'P1 Request'
                                : isVisit
                                  ? 'Visit'
                                  : 'Request'}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="mt-1.5 truncate text-sm font-bold text-slate-900 dark:text-white">
                            {activity.title}
                          </h3>

                          {/* Subtitle */}
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {activity.subtitle}
                          </p>
                        </div>

                        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />
                      </div>
                    </div>
                  </Link>
                )
              },
            )}
          </div>
        )}

        {/* ===================================================
            SELECTED DAY SUMMARY
        ==================================================== */}
        {selectedDay &&
          selectedDay.total > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-2">
              {/* Visits */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <MapPin className="h-4 w-4 text-teal-500" />

                <p className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  {selectedDay.visitCount}
                </p>

                <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  Visits
                </p>
              </div>

              {/* P1 */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <AlertCircle className="h-4 w-4 text-red-500" />

                <p className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  {selectedDay.p1}
                </p>

                <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  P1
                </p>
              </div>

              {/* Requests */}
              <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
                <Clock3 className="h-4 w-4 text-slate-500" />

                <p className="mt-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  {selectedDay.requestCount}
                </p>

                <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                  Requests
                </p>
              </div>
            </div>
          )}
      </main>

      {/* =====================================================
          FLOATING ACTION BUTTON
      ====================================================== */}
      <Link
        to="/mobile/capture"
        aria-label="Create new activity"
        className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-teal-600 text-white shadow-xl shadow-teal-600/30 transition hover:scale-105 hover:bg-teal-700 active:scale-95"
      >
        <Plus className="h-6 w-6" />
      </Link>
    </div>
  )
}