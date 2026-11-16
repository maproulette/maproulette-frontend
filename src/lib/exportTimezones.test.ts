import { describe, expect, it } from 'vitest'
import { exportTimezoneOptions, localTimezoneOffset } from './exportTimezones.ts'

describe('exportTimezoneOptions', () => {
  it('offers offsets in the +HH:MM form the backend expects', () => {
    for (const option of exportTimezoneOptions) {
      expect(option.value).toMatch(/^[+-]\d{2}:\d{2}$/)
    }
  })

  it('includes GMT', () => {
    expect(exportTimezoneOptions.some((option) => option.value === '+00:00')).toBe(true)
  })
})

describe('localTimezoneOffset', () => {
  const withOffset = (minutesBehindUtc: number) =>
    ({ getTimezoneOffset: () => minutesBehindUtc }) as Date

  it('inverts the sign of getTimezoneOffset', () => {
    // US Eastern reports +300 (five hours behind UTC) and is written -05:00.
    expect(localTimezoneOffset(withOffset(300))).toBe('-05:00')
    // Central Europe reports -60 and is written +01:00.
    expect(localTimezoneOffset(withOffset(-60))).toBe('+01:00')
  })

  it('handles half-hour zones', () => {
    expect(localTimezoneOffset(withOffset(-330))).toBe('+05:30')
  })

  it('is GMT for offsets not on the list', () => {
    // Nepal is +05:45, which the selector does not offer.
    expect(localTimezoneOffset(withOffset(-345))).toBe('+00:00')
  })

  it('is GMT at UTC', () => {
    expect(localTimezoneOffset(withOffset(0))).toBe('+00:00')
  })
})
