import { describe, expect, it } from 'vitest'
import type { TaskMarker } from '@/types/Task'
import {
  buildSelectedTaskCollection,
  calculateTaskCount,
  convertTaskMarkersToGeoJSON,
  isTaskEligibleForBundle,
  isValidLocation,
  processMarkersData,
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

describe('buildSelectedTaskCollection', () => {
  const notSpidered = { has: () => false }
  const spideredSet = { has: (id: number) => id === 1 }

  it('returns an empty collection when marker is null or undefined', () => {
    expect(buildSelectedTaskCollection(null, notSpidered)).toEqual({
      type: 'FeatureCollection',
      features: [],
    })
    expect(buildSelectedTaskCollection(undefined, notSpidered)).toEqual({
      type: 'FeatureCollection',
      features: [],
    })
  })

  it('returns an empty collection when the marker has no location', () => {
    const noLocation = marker({ location: undefined as unknown as TaskMarker['location'] })
    expect(buildSelectedTaskCollection(noLocation, notSpidered)).toEqual({
      type: 'FeatureCollection',
      features: [],
    })
  })

  it('returns an empty collection when the marker is spidered', () => {
    expect(buildSelectedTaskCollection(marker({ id: 1 }), spideredSet)).toEqual({
      type: 'FeatureCollection',
      features: [],
    })
  })

  it('builds a single-feature collection for a valid, non-spidered marker', () => {
    const result = buildSelectedTaskCollection(marker({ id: 1, priority: 2 }), notSpidered)
    expect(result).toEqual({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [10, 20] },
          properties: { id: 1, status: TASK_STATUS.CREATED, priority: 2 },
        },
      ],
    })
  })
})

describe('convertTaskMarkersToGeoJSON', () => {
  it('converts a TaskMarker into a point feature', () => {
    const result = convertTaskMarkersToGeoJSON([marker({ id: 1, bundleId: 3, lockedBy: 4 })])
    expect(result.features).toHaveLength(1)
    expect(result.features[0]).toMatchObject({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [10, 20] },
      properties: {
        id: 1,
        status: TASK_STATUS.CREATED,
        priority: 0,
        bundleId: 3,
        lockedBy: 4,
        cluster: false,
        isOverlapping: false,
        isSelected: false,
        isHovered: false,
        isHighlighted: false,
      },
    })
  })

  it('defaults bundleId and lockedBy to null when absent', () => {
    const result = convertTaskMarkersToGeoJSON([marker({ id: 1 })])
    expect(result.features[0].properties).toMatchObject({ bundleId: null, lockedBy: null })
  })

  it('skips markers with no location', () => {
    const result = convertTaskMarkersToGeoJSON([
      marker({ id: 1, location: undefined as unknown as TaskMarker['location'] }),
    ])
    expect(result.features).toHaveLength(0)
  })

  it('converts multiple markers', () => {
    const result = convertTaskMarkersToGeoJSON([marker({ id: 1 }), marker({ id: 2 })])
    expect(result.features).toHaveLength(2)
    expect(result.type).toBe('FeatureCollection')
  })
})

describe('calculateTaskCount', () => {
  it('returns 0 for null/undefined/falsy input', () => {
    expect(calculateTaskCount(null)).toBe(0)
    expect(calculateTaskCount(undefined)).toBe(0)
  })

  it('counts the markers array in the backend response shape', () => {
    expect(calculateTaskCount({ markers: [marker(), marker()] })).toBe(2)
  })

  it('returns 0 when markers is missing or not an array', () => {
    expect(calculateTaskCount({ overlaps: [] })).toBe(0)
    expect(calculateTaskCount({ markers: 'nope' })).toBe(0)
  })

  it('returns 0 for an unrecognized object shape', () => {
    expect(calculateTaskCount({ foo: 'bar' })).toBe(0)
  })

  it('returns 0 for non-object input', () => {
    expect(calculateTaskCount('nope')).toBe(0)
    expect(calculateTaskCount(42)).toBe(0)
  })
})

describe('processMarkersData', () => {
  it('returns empty results for falsy input', () => {
    expect(processMarkersData(null)).toEqual({ markers: [], overlapMarkers: [] })
  })

  it('handles the backend response shape with markers and overlaps arrays', () => {
    const m = marker({ id: 1 })
    const overlap = { tasks: [marker({ id: 2 })], location: { lng: 1, lat: 2 } }
    const result = processMarkersData({ markers: [m], overlaps: [overlap] })
    expect(result).toEqual({ markers: [m], overlapMarkers: [overlap] })
  })

  it('defaults to empty arrays when markers/overlaps fields are not arrays', () => {
    const result = processMarkersData({ markers: 'nope', overlaps: null })
    expect(result).toEqual({ markers: [], overlapMarkers: [] })
  })

  it('returns empty results when the overlaps key is missing', () => {
    expect(processMarkersData({ markers: [marker()] })).toEqual({
      markers: [],
      overlapMarkers: [],
    })
  })

  it('returns empty results for an unrecognized object shape', () => {
    expect(processMarkersData({ foo: 'bar' })).toEqual({ markers: [], overlapMarkers: [] })
  })

  it('returns empty results for non-object input', () => {
    expect(processMarkersData('nope')).toEqual({ markers: [], overlapMarkers: [] })
    expect(processMarkersData([marker()])).toEqual({ markers: [], overlapMarkers: [] })
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
