import { describe, expect, it } from 'vitest'
import type { ChallengeActivityEntry } from '@/types/Challenge'
import { buildDayGroups, dateSortKey } from './ChallengeRecentActivity'

const entry = (overrides: Partial<ChallengeActivityEntry> = {}): ChallengeActivityEntry => ({
  date: '2024-06-01',
  status: 1,
  statusName: 'Fixed',
  count: 1,
  ...overrides,
})

describe('dateSortKey', () => {
  it('converts a numeric (epoch ms) date to an ISO day string', () => {
    const epochMs = Date.UTC(2024, 5, 15) // June 15, 2024 UTC
    expect(dateSortKey(epochMs)).toBe('2024-06-15')
  })

  it('converts an all-digit epoch-ms string to an ISO day string', () => {
    const epochMs = Date.UTC(2024, 5, 15)
    expect(dateSortKey(String(epochMs))).toBe('2024-06-15')
  })

  it('takes the first 10 characters of a non-numeric date string as-is', () => {
    expect(dateSortKey('2024-06-15T08:30:00.000Z')).toBe('2024-06-15')
  })

  it('does not treat a plain ISO date string as an epoch number', () => {
    expect(dateSortKey('2024-06-15')).toBe('2024-06-15')
  })
})

describe('buildDayGroups', () => {
  it('trims to the most recent MAX_RAW_ENTRIES (90) raw entries before grouping', () => {
    // 5 old entries on a day that should be trimmed away...
    const oldEntries = Array.from({ length: 5 }, () => entry({ date: '2024-01-01', count: 1 }))
    // ...followed by 90 entries on a different day, which fill the trim window exactly.
    const recentEntries = Array.from({ length: 90 }, () => entry({ date: '2024-06-01', count: 1 }))

    const groups = buildDayGroups([...oldEntries, ...recentEntries])

    expect(groups).toHaveLength(1)
    expect(groups[0].day).toBe('2024-06-01')
    expect(groups[0].rows).toHaveLength(90)
  })

  it('groups entries by day, combining differing date representations for the same day', () => {
    const epochMs = Date.UTC(2024, 5, 1) // 2024-06-01
    const entries = [
      entry({ date: '2024-06-01T09:00:00.000Z', status: 1, statusName: 'Fixed', count: 2 }),
      entry({ date: epochMs, status: 2, statusName: 'False Positive', count: 3 }),
      entry({ date: String(epochMs), status: 3, statusName: 'Skipped', count: 4 }),
    ]

    const groups = buildDayGroups(entries)

    expect(groups).toHaveLength(1)
    expect(groups[0].day).toBe('2024-06-01')
    expect(groups[0].rows).toHaveLength(3)
    expect(groups[0].rows.map((r) => r.count)).toEqual([2, 3, 4])
  })

  it('sorts day groups in descending (most recent first) order', () => {
    const entries = [
      entry({ date: '2024-01-01', count: 1 }),
      entry({ date: '2024-01-03', count: 1 }),
      entry({ date: '2024-01-02', count: 1 }),
    ]

    const groups = buildDayGroups(entries)

    expect(groups.map((g) => g.day)).toEqual(['2024-01-03', '2024-01-02', '2024-01-01'])
  })

  it('caps the number of returned day groups at MAX_DAY_GROUPS (14), keeping the most recent', () => {
    const days = Array.from({ length: 20 }, (_, i) => `2024-01-${String(i + 1).padStart(2, '0')}`)
    const entries = days.map((date) => entry({ date, count: 1 }))

    const groups = buildDayGroups(entries)

    expect(groups).toHaveLength(14)
    // The 14 most recent days out of 2024-01-01..20 are 2024-01-07..2024-01-20, descending.
    expect(groups[0].day).toBe('2024-01-20')
    expect(groups[groups.length - 1].day).toBe('2024-01-07')
    expect(groups.some((g) => g.day === '2024-01-01')).toBe(false)
  })

  it('filters out zero-count entries within a day, and drops the day entirely if all its entries are zero', () => {
    const entries = [
      entry({ date: '2024-02-01', status: 1, count: 0 }),
      entry({ date: '2024-02-01', status: 2, count: 5 }),
      entry({ date: '2024-02-02', status: 1, count: 0 }),
    ]

    const groups = buildDayGroups(entries)

    expect(groups).toHaveLength(1)
    expect(groups[0].day).toBe('2024-02-01')
    expect(groups[0].rows).toHaveLength(1)
    expect(groups[0].rows[0].status).toBe(2)
  })
})
