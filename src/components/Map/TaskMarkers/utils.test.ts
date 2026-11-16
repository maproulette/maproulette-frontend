import { describe, expect, it } from 'vitest'
import type { TaskMarker } from '@/types/Task'
import {
  flattenTaskMarkers,
  isTaskEligibleForBundle,
  isValidLocation,
  TASK_STATUS,
} from './utils.ts'

const marker = (overrides: Partial<TaskMarker> = {}): TaskMarker => ({
  id: 1,
  location: { lng: 10, lat: 20 },
  status: TASK_STATUS.CREATED,
  priority: 0,
  ...overrides,
})

describe('isTaskEligibleForBundle', () => {
  it('is eligible when unlocked, unbundled, and status is bundle-eligible', () => {
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.CREATED }, null, 1)).toBe(true)
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.SKIPPED }, null, 1)).toBe(true)
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.TOO_HARD }, null, 1)).toBe(true)
  })

  it('is ineligible when locked by a different user', () => {
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.CREATED, lockedBy: 2 }, null, 1)).toBe(
      false
    )
  })

  it('is eligible when locked by the current user', () => {
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.CREATED, lockedBy: 1 }, null, 1)).toBe(
      true
    )
  })

  it('is eligible when lockedBy or currentUserId is null/undefined', () => {
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.CREATED, lockedBy: null }, null, 1)).toBe(
      true
    )
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.CREATED, lockedBy: 2 }, null, null)).toBe(
      true
    )
  })

  it('is ineligible when bundleId does not match the primary task', () => {
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.CREATED, bundleId: 5 }, 6, 1)).toBe(false)
  })

  it('treats null and undefined bundleId as equivalent', () => {
    expect(
      isTaskEligibleForBundle({ status: TASK_STATUS.CREATED, bundleId: null }, undefined, 1)
    ).toBe(true)
  })

  it('is eligible when bundleId matches the primary task', () => {
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.CREATED, bundleId: 5 }, 5, 1)).toBe(true)
  })

  it('is ineligible for statuses outside the bundle-eligible set', () => {
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.FIXED }, null, 1)).toBe(false)
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.FALSE_POSITIVE }, null, 1)).toBe(false)
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.DELETED }, null, 1)).toBe(false)
    expect(isTaskEligibleForBundle({ status: TASK_STATUS.ALREADY_FIXED }, null, 1)).toBe(false)
  })
})

describe('flattenTaskMarkers', () => {
  it('returns no markers for input that is not a markers response', () => {
    expect(flattenTaskMarkers(null)).toEqual([])
    expect(flattenTaskMarkers('nope')).toEqual([])
    expect(flattenTaskMarkers({ foo: 'bar' })).toEqual([])
    expect(flattenTaskMarkers([marker()])).toEqual([])
  })

  it('includes the tasks the backend groups under overlaps, which it leaves out of markers', () => {
    const single = marker({ id: 1 })
    const stacked = [marker({ id: 2 }), marker({ id: 3 })]
    const result = flattenTaskMarkers({
      markers: [single],
      overlaps: [{ tasks: stacked, location: { lng: 10, lat: 20 } }],
    })
    expect(result.map((m) => m.id)).toEqual([1, 2, 3])
  })

  it('reads whichever of markers and overlaps is present', () => {
    expect(flattenTaskMarkers({ markers: [marker()] })).toHaveLength(1)
    expect(flattenTaskMarkers({ overlaps: [{ tasks: [marker()] }] })).toHaveLength(1)
    expect(flattenTaskMarkers({ markers: 'nope', overlaps: null })).toEqual([])
  })
})

describe('isValidLocation', () => {
  it('is true for a finite numeric location', () => {
    expect(isValidLocation({ lng: 1, lat: 2 })).toBe(true)
  })

  it('is false for null or undefined', () => {
    expect(isValidLocation(null)).toBe(false)
    expect(isValidLocation(undefined)).toBe(false)
  })

  it('is false for NaN coordinates', () => {
    expect(isValidLocation({ lng: NaN, lat: 2 })).toBe(false)
    expect(isValidLocation({ lng: 1, lat: NaN })).toBe(false)
  })

  it('is false for non-finite coordinates', () => {
    expect(isValidLocation({ lng: Infinity, lat: 2 })).toBe(false)
    expect(isValidLocation({ lng: 1, lat: -Infinity })).toBe(false)
  })

  it('is false for non-numeric coordinates', () => {
    expect(isValidLocation({ lng: '1' as unknown as number, lat: 2 })).toBe(false)
  })
})
