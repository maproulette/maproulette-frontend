import { describe, expect, it } from 'vitest'
import type { UserActivityEntry } from '@/api/user/profile'
import type { TranslateFn } from '@/i18n'
import { aggregateContributions } from './contributionsAggregation'

// Minimal stand-in for the real t() - returns the default message with any
// {placeholder} values substituted, which is enough to exercise the
// unknown-challenge-name fallback path used by aggregateContributions.
const t: TranslateFn = (_id, values, defaultMessage) => {
  let message = defaultMessage ?? ''
  if (values) {
    for (const [key, value] of Object.entries(values)) {
      message = message.replace(`{${key}}`, String(value))
    }
  }
  return message
}

const makeEntry = (overrides: Partial<UserActivityEntry>): UserActivityEntry => ({
  id: 1,
  created: '2025-01-01T12:00:00.000Z',
  osmUserId: 1,
  typeId: 1,
  parentId: 1,
  parentName: 'Test Challenge',
  itemId: 1,
  action: 1,
  status: 1,
  extra: '',
  ...overrides,
})

describe('aggregateContributions', () => {
  it('returns an empty result for undefined input', () => {
    expect(aggregateContributions(undefined, t)).toEqual({
      groupedActivities: [],
      totalTasks: 0,
    })
  })

  it('returns an empty result for an empty array', () => {
    expect(aggregateContributions([], t)).toEqual({
      groupedActivities: [],
      totalTasks: 0,
    })
  })

  it('groups a multi-day, multi-challenge, multi-status input by date -> challenge -> status', () => {
    const activities: UserActivityEntry[] = [
      makeEntry({
        created: '2025-06-02T10:00:00.000Z',
        parentId: 10,
        parentName: 'Challenge A',
        status: 1,
      }),
      makeEntry({
        created: '2025-06-02T11:00:00.000Z',
        parentId: 10,
        parentName: 'Challenge A',
        status: 1,
      }),
      makeEntry({
        created: '2025-06-02T12:00:00.000Z',
        parentId: 10,
        parentName: 'Challenge A',
        status: 2,
      }),
      makeEntry({
        created: '2025-06-02T13:00:00.000Z',
        parentId: 20,
        parentName: 'Challenge B',
        status: 3,
      }),
      makeEntry({
        created: '2025-06-01T09:00:00.000Z',
        parentId: 10,
        parentName: 'Challenge A',
        status: 1,
      }),
    ]

    const { groupedActivities, totalTasks } = aggregateContributions(activities, t)

    expect(totalTasks).toBe(5)
    expect(groupedActivities).toHaveLength(2)

    // Most recent date first
    const [june2, june1] = groupedActivities
    expect(june2.date).toContain('JUNE 2')
    expect(june1.date).toContain('JUNE 1')

    expect(june2.challenges).toHaveLength(2)
    const challengeA = june2.challenges.find((c) => c.parentId === 10)
    const challengeB = june2.challenges.find((c) => c.parentId === 20)

    expect(challengeA).toEqual({
      name: 'Challenge A',
      parentId: 10,
      actions: [
        { status: 1, count: 2 },
        { status: 2, count: 1 },
      ],
    })
    expect(challengeB).toEqual({
      name: 'Challenge B',
      parentId: 20,
      actions: [{ status: 3, count: 1 }],
    })

    expect(june1.challenges).toEqual([
      {
        name: 'Challenge A',
        parentId: 10,
        actions: [{ status: 1, count: 1 }],
      },
    ])
  })

  it('does not collide same month/day entries from different years', () => {
    const activities: UserActivityEntry[] = [
      makeEntry({ created: '2024-03-15T12:00:00.000Z', parentId: 1, status: 1 }),
      makeEntry({ created: '2025-03-15T12:00:00.000Z', parentId: 1, status: 1 }),
    ]

    const { groupedActivities, totalTasks } = aggregateContributions(activities, t)

    expect(totalTasks).toBe(2)
    // Each year's March 15th must land in its own bucket, not merge into one.
    expect(groupedActivities).toHaveLength(2)
    expect(groupedActivities.every((group) => group.challenges[0].actions[0].count === 1)).toBe(
      true
    )
  })

  it('omits the year from the date label for entries dated in the current year', () => {
    const currentYear = new Date().getFullYear()
    const activities: UserActivityEntry[] = [
      makeEntry({ created: `${currentYear}-03-15T12:00:00.000Z`, parentId: 1, status: 1 }),
    ]

    const { groupedActivities } = aggregateContributions(activities, t)

    expect(groupedActivities).toHaveLength(1)
    expect(groupedActivities[0].date).not.toContain(String(currentYear))
  })

  it('sorts grouped dates from most recent to least recent', () => {
    const activities: UserActivityEntry[] = [
      makeEntry({ created: '2025-01-05T12:00:00.000Z', parentId: 1 }),
      makeEntry({ created: '2025-03-20T12:00:00.000Z', parentId: 1 }),
      makeEntry({ created: '2025-02-10T12:00:00.000Z', parentId: 1 }),
    ]

    const { groupedActivities } = aggregateContributions(activities, t)

    expect(groupedActivities.map((g) => g.date)).toEqual([
      groupedActivities[0].date,
      groupedActivities[1].date,
      groupedActivities[2].date,
    ])
    expect(groupedActivities[0].date).toContain('MARCH 20')
    expect(groupedActivities[1].date).toContain('FEBRUARY 10')
    expect(groupedActivities[2].date).toContain('JANUARY 5')
  })

  it('sorts actions within a challenge by status', () => {
    const activities: UserActivityEntry[] = [
      makeEntry({ created: '2025-06-02T12:00:00.000Z', parentId: 1, status: 5 }),
      makeEntry({ created: '2025-06-02T12:01:00.000Z', parentId: 1, status: 1 }),
      makeEntry({ created: '2025-06-02T12:02:00.000Z', parentId: 1, status: 3 }),
    ]

    const { groupedActivities } = aggregateContributions(activities, t)

    expect(groupedActivities[0].challenges[0].actions.map((a) => a.status)).toEqual([1, 3, 5])
  })

  it('falls back to a translated placeholder name when a challenge name is missing', () => {
    const activities: UserActivityEntry[] = [
      makeEntry({ created: '2025-06-02T12:00:00.000Z', parentId: 99, parentName: '', status: 1 }),
    ]

    const { groupedActivities } = aggregateContributions(activities, t)

    expect(groupedActivities[0].challenges[0].name).toBe('Challenge 99')
  })
})
