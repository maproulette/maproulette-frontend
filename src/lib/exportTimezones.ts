/**
 * Timezone offsets a challenge export can be rendered in. The backend takes an
 * offset of the form `+HH:MM` and applies it to the timestamp columns; GMT is
 * the default, which is what an export gets when nothing is chosen.
 */
export const EXPORT_TIMEZONE_DEFAULT = ''

const OFFSETS = [
  ['-12:00', 'UTC−12:00'],
  ['-11:00', 'UTC−11:00'],
  ['-10:00', 'UTC−10:00 (Hawaii)'],
  ['-09:00', 'UTC−09:00 (Alaska)'],
  ['-08:00', 'UTC−08:00 (US Pacific)'],
  ['-07:00', 'UTC−07:00 (US Mountain)'],
  ['-06:00', 'UTC−06:00 (US Central)'],
  ['-05:00', 'UTC−05:00 (US Eastern)'],
  ['-04:00', 'UTC−04:00'],
  ['-03:00', 'UTC−03:00'],
  ['-02:00', 'UTC−02:00'],
  ['-01:00', 'UTC−01:00'],
  ['+00:00', 'UTC±00:00 (GMT)'],
  ['+01:00', 'UTC+01:00 (Central Europe)'],
  ['+02:00', 'UTC+02:00 (Eastern Europe)'],
  ['+03:00', 'UTC+03:00'],
  ['+04:00', 'UTC+04:00'],
  ['+05:00', 'UTC+05:00'],
  ['+05:30', 'UTC+05:30 (India)'],
  ['+06:00', 'UTC+06:00'],
  ['+07:00', 'UTC+07:00'],
  ['+08:00', 'UTC+08:00 (China)'],
  ['+09:00', 'UTC+09:00 (Japan)'],
  ['+09:30', 'UTC+09:30 (Central Australia)'],
  ['+10:00', 'UTC+10:00 (Eastern Australia)'],
  ['+11:00', 'UTC+11:00'],
  ['+12:00', 'UTC+12:00 (New Zealand)'],
] as const

export const exportTimezoneOptions = OFFSETS.map(([value, label]) => ({ value, label }))

/**
 * The browser's current UTC offset as a `+HH:MM` string, so the timezone
 * selector can open on something sensible rather than always on GMT.
 */
export const localTimezoneOffset = (date: Date = new Date()): string => {
  // getTimezoneOffset counts minutes *behind* UTC, so the sign is inverted.
  const totalMinutes = -date.getTimezoneOffset()
  const sign = totalMinutes < 0 ? '-' : '+'
  const absolute = Math.abs(totalMinutes)
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0')
  const minutes = String(absolute % 60).padStart(2, '0')
  const offset = `${sign}${hours}:${minutes}`
  // Fall back to GMT for the handful of zones we don't list (e.g. +05:45).
  return exportTimezoneOptions.some((option) => option.value === offset) ? offset : '+00:00'
}
