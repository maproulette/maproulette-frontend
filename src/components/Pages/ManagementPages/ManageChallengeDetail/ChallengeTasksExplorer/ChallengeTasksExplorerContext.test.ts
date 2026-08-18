import { describe, expect, it } from 'vitest'
import { DEFAULT_PRIORITY_FILTER, DEFAULT_TASK_STATUS_FILTER } from '@/lib/challengeTaskTableSearch'
import type { TaskMarker } from '@/types/Task'
import { sortTaskMarkers, toggleFilterWithMinimumOne } from './ChallengeTasksExplorerContext'

const marker = (overrides: Partial<TaskMarker> = {}): TaskMarker => ({
  id: 1,
  location: { lat: 0, lng: 0 },
  status: 0,
  priority: 0,
  ...overrides,
})

describe('sortTaskMarkers', () => {
  it('sorts by id ascending', () => {
    const markers = [marker({ id: 3 }), marker({ id: 1 }), marker({ id: 2 })]

    const sorted = sortTaskMarkers(markers, 'id', false)

    expect(sorted.map((m) => m.id)).toEqual([1, 2, 3])
  })

  it('sorts by id descending', () => {
    const markers = [marker({ id: 3 }), marker({ id: 1 }), marker({ id: 2 })]

    const sorted = sortTaskMarkers(markers, 'id', true)

    expect(sorted.map((m) => m.id)).toEqual([3, 2, 1])
  })

  it('sorts by status', () => {
    const markers = [marker({ id: 1, status: 2 }), marker({ id: 2, status: 0 })]

    const sorted = sortTaskMarkers(markers, 'status', false)

    expect(sorted.map((m) => m.id)).toEqual([2, 1])
  })

  it('sorts by priority', () => {
    const markers = [marker({ id: 1, priority: 2 }), marker({ id: 2, priority: 0 })]

    const sorted = sortTaskMarkers(markers, 'priority', false)

    expect(sorted.map((m) => m.id)).toEqual([2, 1])
  })

  it('does not mutate the input array', () => {
    const markers = [marker({ id: 3 }), marker({ id: 1 })]
    const original = [...markers]

    sortTaskMarkers(markers, 'id', false)

    expect(markers).toEqual(original)
  })

  it('returns a new array reference', () => {
    const markers = [marker({ id: 1 })]

    expect(sortTaskMarkers(markers, 'id', false)).not.toBe(markers)
  })
})

describe('toggleFilterWithMinimumOne', () => {
  it('enables a currently-disabled value', () => {
    const prev = { 0: true, 1: false }

    const next = toggleFilterWithMinimumOne(prev, [0, 1] as const, 1, true)

    expect(next).toEqual({ 0: true, 1: true })
  })

  it('disables a value when more than one value is enabled', () => {
    const prev = { 0: true, 1: true }

    const next = toggleFilterWithMinimumOne(prev, [0, 1] as const, 1, false)

    expect(next).toEqual({ 0: true, 1: false })
  })

  it('is a no-op when trying to disable the last remaining enabled value', () => {
    const prev = { 0: true, 1: false }

    const next = toggleFilterWithMinimumOne(prev, [0, 1] as const, 0, false)

    expect(next).toBe(prev)
    expect(next).toEqual({ 0: true, 1: false })
  })

  it('is a no-op when trying to disable a value while all tracked values are already disabled', () => {
    const prev = { 0: false, 1: false }

    const next = toggleFilterWithMinimumOne(prev, [0, 1] as const, 1, false)

    expect(next).toBe(prev)
  })

  it('enforces the minimum-one invariant across the full default task status filter set', () => {
    const allOff = Object.fromEntries(DEFAULT_TASK_STATUS_FILTER.map((s) => [s, false]))
    const prev = { ...allOff, [DEFAULT_TASK_STATUS_FILTER[0]]: true }

    const next = toggleFilterWithMinimumOne(
      prev,
      DEFAULT_TASK_STATUS_FILTER,
      DEFAULT_TASK_STATUS_FILTER[0],
      false
    )

    expect(next).toBe(prev)
  })

  it('enforces the minimum-one invariant across the full default priority filter set', () => {
    const allOff = Object.fromEntries(DEFAULT_PRIORITY_FILTER.map((p) => [p, false]))
    const prev = { ...allOff, [DEFAULT_PRIORITY_FILTER[0]]: true }

    const next = toggleFilterWithMinimumOne(
      prev,
      DEFAULT_PRIORITY_FILTER,
      DEFAULT_PRIORITY_FILTER[0],
      false
    )

    expect(next).toBe(prev)
  })
})
