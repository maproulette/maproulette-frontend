import { describe, expect, it, vi } from 'vitest'
import {
  daysSince,
  formatDate,
  formatDateTime,
  formatDurationSeconds,
  formatLongDate,
  formatTimeAgo,
} from './date.ts'

const LOCALE = 'en-US'

describe('formatDate', () => {
  it('formats a date in medium style', () => {
    expect(formatDate(new Date('2026-02-01T12:00:00Z'), LOCALE)).toBe('Feb 1, 2026')
  })
})

describe('formatLongDate', () => {
  it('formats a date in long style', () => {
    expect(formatLongDate(new Date('2026-02-01T12:00:00Z'), LOCALE)).toBe('February 1, 2026')
  })
})

describe('formatDateTime', () => {
  it('includes both date and time components', () => {
    const result = formatDateTime(new Date('2026-04-01T14:30:00Z'), LOCALE)
    expect(result).toMatch(/Apr 1, 2026/)
    expect(result).toMatch(/\d{1,2}:\d{2}/)
  })
})

describe('formatTimeAgo', () => {
  // vi.useRealTimers() must run inside the test body (not a beforeEach/afterEach
  // hook) - restoring timers from within a hook after fake timers were active
  // deadlocks under this project's vitest+happy-dom setup.
  const withFrozenNow = (run: () => void) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'))
    try {
      run()
    } finally {
      vi.useRealTimers()
    }
  }

  it('returns "now" for the current instant', () => {
    withFrozenNow(() => {
      expect(formatTimeAgo(new Date('2026-06-02T12:00:00Z'), LOCALE)).toBe('now')
    })
  })

  it('formats minutes in the past', () => {
    withFrozenNow(() => {
      expect(formatTimeAgo(new Date('2026-06-02T11:55:00Z'), LOCALE)).toBe('5 minutes ago')
    })
  })

  it('formats hours in the past', () => {
    withFrozenNow(() => {
      expect(formatTimeAgo(new Date('2026-06-02T09:00:00Z'), LOCALE)).toBe('3 hours ago')
    })
  })

  it('formats one day in the past as "yesterday"', () => {
    withFrozenNow(() => {
      expect(formatTimeAgo(new Date('2026-06-01T12:00:00Z'), LOCALE)).toBe('yesterday')
    })
  })

  it('formats one day in the future as "tomorrow"', () => {
    withFrozenNow(() => {
      expect(formatTimeAgo(new Date('2026-06-03T12:00:00Z'), LOCALE)).toBe('tomorrow')
    })
  })

  it('formats multiple days in the past', () => {
    withFrozenNow(() => {
      expect(formatTimeAgo(new Date('2026-05-30T12:00:00Z'), LOCALE)).toBe('3 days ago')
    })
  })
})

describe('daysSince', () => {
  const withFrozenNow = (run: () => void) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-02T12:00:00Z'))
    try {
      run()
    } finally {
      vi.useRealTimers()
    }
  }

  it('returns 0 for the current instant', () => {
    withFrozenNow(() => {
      expect(daysSince(new Date('2026-06-02T12:00:00Z'))).toBe(0)
    })
  })

  it('returns whole days for past dates', () => {
    withFrozenNow(() => {
      expect(daysSince(new Date('2026-05-30T12:00:00Z'))).toBe(3)
    })
  })

  it('floors partial days', () => {
    withFrozenNow(() => {
      expect(daysSince(new Date('2026-06-01T18:00:00Z'))).toBe(0)
    })
  })

  it('returns a negative value for future dates', () => {
    withFrozenNow(() => {
      expect(daysSince(new Date('2026-06-05T12:00:00Z'))).toBe(-3)
    })
  })
})

describe('formatDurationSeconds', () => {
  it('formats sub-minute spans in seconds', () => {
    expect(formatDurationSeconds(45, LOCALE)).toBe('45 sec')
  })

  it('formats sub-hour spans as minutes and seconds', () => {
    expect(formatDurationSeconds(750, LOCALE)).toBe('12 min 30 sec')
  })

  it('formats hour-plus spans as hours and minutes', () => {
    expect(formatDurationSeconds(7000, LOCALE)).toBe('1 hr 56 min')
  })

  it('drops a zero-valued trailing unit', () => {
    expect(formatDurationSeconds(600, LOCALE)).toBe('10 min')
    expect(formatDurationSeconds(7200, LOCALE)).toBe('2 hr')
  })

  it('clamps negative input to zero', () => {
    expect(formatDurationSeconds(-5, LOCALE)).toBe('0 sec')
  })
})
