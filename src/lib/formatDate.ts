export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

/**
 * "Now", formatted for an `<input type="datetime-local">`'s `min`/`value`
 * attribute (local wall-clock time, no timezone suffix). Never build this
 * with `date.toISOString()` — that converts to UTC first, which can shift
 * the date by a day depending on the viewer's offset from UTC.
 */
export function nowForDatetimeLocal(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Today's local date for an `<input type="date">`'s `min`/`value` attribute.
 * Same rule as nowForDatetimeLocal — never `.toISOString().slice(0, 10)`,
 * which reads UTC's date and can be a day off from the viewer's actual today.
 */
export function todayForDateInput(): string {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * An ISO timestamp's calendar date in the *viewer's* local timezone — for
 * "is this scheduled for today" checks. Do not use `iso.slice(0, 10)` for
 * this: that reads the UTC date embedded in the string, which can be a day
 * off from the viewer's actual local date near midnight.
 */
export function toLocalDateKey(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Same as toLocalDateKey, but for a Date object already in hand. */
export function localDateKey(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * An ISO timestamp's HH:mm in the viewer's local timezone — for compact
 * schedule-board time labels. Do not use `iso.slice(11, 16)` for this: that
 * reads the UTC wall-clock time embedded in the string, not the viewer's.
 */
export function toLocalTimeKey(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
