/**
 * Date formatting utilities built on the native Intl APIs.
 *
 * All formatters accept a `Date`; callers are responsible for constructing one
 * (the backend returns Unix milliseconds, so `new Date(timestamp)` works
 * directly) and for handling missing values themselves.
 *
 * `locale` is optional and falls back to the browser default. Components that
 * want app-locale-aware output should read it from `useIntl()` and pass it in.
 */

export function formatDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date)
}

export function formatLongDate(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long' }).format(date)
}

export function formatDateTime(date: Date, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date)
}

const RELATIVE_UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ['year', 365 * 24 * 60 * 60 * 1000],
  ['month', 30 * 24 * 60 * 60 * 1000],
  ['week', 7 * 24 * 60 * 60 * 1000],
  ['day', 24 * 60 * 60 * 1000],
  ['hour', 60 * 60 * 1000],
  ['minute', 60 * 1000],
  ['second', 1000],
]

export function formatTimeAgo(date: Date, locale?: string): string {
  const diffMs = date.getTime() - Date.now()
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, unitMs] of RELATIVE_UNITS) {
    if (Math.abs(diffMs) >= unitMs) {
      return formatter.format(Math.round(diffMs / unitMs), unit)
    }
  }
  return formatter.format(0, 'second')
}

export function daysSince(date: Date): number {
  return Math.floor((Date.now() - date.getTime()) / (24 * 60 * 60 * 1000))
}

/**
 * Format a span of seconds as a compact, locale-aware duration
 * (e.g. `7000` -> "1 hr 56 min"). Only the two most significant units are
 * shown, and a zero-valued trailing unit is dropped, so the result stays
 * short enough to sit inline in a stat row.
 */
export function formatDurationSeconds(totalSeconds: number, locale?: string): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  const unit = (value: number, unit: 'hour' | 'minute' | 'second') =>
    new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'short' }).format(value)

  if (seconds < 60) return unit(seconds, 'second')

  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const rest = seconds % 60
    return rest === 0
      ? unit(minutes, 'minute')
      : `${unit(minutes, 'minute')} ${unit(rest, 'second')}`
  }

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  return minutes === 0 ? unit(hours, 'hour') : `${unit(hours, 'hour')} ${unit(minutes, 'minute')}`
}
