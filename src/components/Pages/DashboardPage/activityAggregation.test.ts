import { describe, expect, it } from 'vitest'
import { testT } from '@/test/translate'
import type { UserContribution } from '@/types/User'
import { aggregateActivity } from './activityAggregation'

const t = testT

const makeEntry = (overrides: Partial<UserContribution>): UserContribution => ({
  id: 1,
  created: '2025-01-01T12:00:00.000Z',
  osmUserId: 1,
  typeId: 1,
  parentId: 1,
  parentName: 'Test Challenge',
  itemId: 1,
  action: 4,
  status: 1,
  extra: '',
  ...overrides,
})

describe('aggregateActivity', () => {
  it('returns an empty result for undefined input', () => {
    expect(aggregateActivity(undefined, t, 'en-US')).toEqual([])
  })

  it('returns an empty result for an empty array', () => {
    expect(aggregateActivity([], t, 'en-US')).toEqual([])
  })

  it('groups a multi-day, multi-challenge, multi-status input by date -> challenge -> status', () => {
    const activities: UserContribution[] = [
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

    const groupedActivities = aggregateActivity(activities, t, 'en-US')

    expect(groupedActivities).toHaveLength(2)

    // Most recent date first
    const [june2, june1] = groupedActivities
    expect(june2.date).toContain('June 2')
    expect(june1.date).toContain('June 1')

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
    const activities: UserContribution[] = [
      makeEntry({ created: '2024-03-15T12:00:00.000Z', parentId: 1, status: 1 }),
      makeEntry({ created: '2025-03-15T12:00:00.000Z', parentId: 1, status: 1 }),
    ]

    const groupedActivities = aggregateActivity(activities, t, 'en-US')

    // Each year's March 15th must land in its own bucket, not merge into one.
    expect(groupedActivities).toHaveLength(2)
    expect(groupedActivities.every((group) => group.challenges[0].actions[0].count === 1)).toBe(
      true
    )
  })

  it('labels each day in the chosen language', () => {
    const activities: UserContribution[] = [
      makeEntry({ created: '2025-06-02T12:00:00.000Z', parentId: 1, status: 1 }),
    ]

    const groupedActivities = aggregateActivity(activities, t, 'de')

    expect(groupedActivities[0].date).toContain('Juni')
  })

  it('omits the year from the date label for entries dated in the current year', () => {
    const currentYear = new Date().getFullYear()
    const activities: UserContribution[] = [
      makeEntry({ created: `${currentYear}-03-15T12:00:00.000Z`, parentId: 1, status: 1 }),
    ]

    const groupedActivities = aggregateActivity(activities, t, 'en-US')

    expect(groupedActivities).toHaveLength(1)
    expect(groupedActivities[0].date).not.toContain(String(currentYear))
  })

  it('sorts grouped dates from most recent to least recent', () => {
    const activities: UserContribution[] = [
      makeEntry({ created: '2025-01-05T12:00:00.000Z', parentId: 1 }),
      makeEntry({ created: '2025-03-20T12:00:00.000Z', parentId: 1 }),
      makeEntry({ created: '2025-02-10T12:00:00.000Z', parentId: 1 }),
    ]

    const groupedActivities = aggregateActivity(activities, t, 'en-US')

    expect(groupedActivities.map((g) => g.date)).toEqual([
      groupedActivities[0].date,
      groupedActivities[1].date,
      groupedActivities[2].date,
    ])
    expect(groupedActivities[0].date).toContain('March 20')
    expect(groupedActivities[1].date).toContain('February 10')
    expect(groupedActivities[2].date).toContain('January 5')
  })

  it('sorts actions within a challenge by status', () => {
    const activities: UserContribution[] = [
      makeEntry({ created: '2025-06-02T12:00:00.000Z', parentId: 1, status: 5 }),
      makeEntry({ created: '2025-06-02T12:01:00.000Z', parentId: 1, status: 1 }),
      makeEntry({ created: '2025-06-02T12:02:00.000Z', parentId: 1, status: 3 }),
    ]

    const groupedActivities = aggregateActivity(activities, t, 'en-US')

    expect(groupedActivities[0].challenges[0].actions.map((a) => a.status)).toEqual([1, 3, 5])
  })

  it('falls back to a translated placeholder name when a challenge name is missing', () => {
    const activities: UserContribution[] = [
      makeEntry({ created: '2025-06-02T12:00:00.000Z', parentId: 99, parentName: '', status: 1 }),
    ]

    const groupedActivities = aggregateActivity(activities, t, 'en-US')

    expect(groupedActivities[0].challenges[0].name).toBe('Challenge 99')
  })

  it('skips entries with no date or no challenge', () => {
    const activities: UserContribution[] = [
      makeEntry({ created: undefined }),
      makeEntry({ parentId: undefined, parentName: undefined }),
      makeEntry({ created: '2025-06-02T12:00:00.000Z', parentId: 7 }),
    ]

    const groupedActivities = aggregateActivity(activities, t, 'en-US')

    expect(groupedActivities[0].challenges.map((c) => c.parentId)).toEqual([7])
  })

  it('ignores actions other than status changes', () => {
    const activities: UserContribution[] = [
      makeEntry({ created: '2025-06-02T12:00:00.000Z', parentId: 1, status: 1 }),
      // An answered task question; its status field holds the answer, not a task status
      makeEntry({ created: '2025-06-02T12:01:00.000Z', parentId: 1, action: 7, status: 3 }),
    ]

    const groupedActivities = aggregateActivity(activities, t, 'en-US')

    expect(groupedActivities[0].challenges[0].actions).toEqual([{ status: 1, count: 1 }])
  })
})
