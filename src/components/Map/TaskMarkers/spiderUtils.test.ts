import type maplibregl from 'maplibre-gl'
import { describe, expect, it } from 'vitest'
import type { TaskMarker } from '@/types/Task'
import { createSpiderGroup, detectVisualOverlaps } from './spiderUtils.ts'

// Mirrors the internal constants in spiderUtils.ts (not exported), used to
// independently recompute expected circle/spiral positions for regression checks.
const CIRCLE_START_ANGLE = (Math.PI * 2) / 12
const SPIRAL_LENGTH_START = 11
const SPIRAL_FOOT_SEPARATION = 28
const SPIRAL_LENGTH_FACTOR = 5
const CLUSTER_ICON_PIXELS = 40

type MockFeature = {
  properties?: Record<string, unknown>
  geometry: { type: string; coordinates: [number, number] }
}

const feature = (
  id: number,
  coords: [number, number],
  extra: Record<string, unknown> = {}
): MockFeature => ({
  properties: { id, ...extra },
  geometry: { type: 'Point', coordinates: coords },
})

// project/unproject are identity mappings so pixel-space math can be
// asserted directly against lng/lat results without a real map projection.
const createMockMap = (
  opts: { exactFeatures?: MockFeature[]; areaFeatures?: MockFeature[] } = {}
): maplibregl.Map => {
  const exact = opts.exactFeatures ?? []
  const area = opts.areaFeatures ?? []
  const map = {
    queryRenderedFeatures: (geometry: unknown) => {
      const isBoxQuery = Array.isArray(geometry) && Array.isArray(geometry[0])
      return isBoxQuery ? area : exact
    },
    project: (lngLat: [number, number]) => ({ x: lngLat[0], y: lngLat[1] }),
    unproject: (point: [number, number]) => ({ lng: point[0], lat: point[1] }),
  }
  return map as unknown as maplibregl.Map
}

const marker = (id: number, lng: number, lat: number): TaskMarker => ({
  id,
  location: { lng, lat },
  status: 0,
  priority: 0,
})

describe('detectVisualOverlaps', () => {
  it('returns an empty array when nothing is rendered at the exact point', () => {
    const map = createMockMap({ exactFeatures: [] })
    expect(detectVisualOverlaps(map, { x: 0, y: 0 }, 'layer')).toEqual([])
  })

  it('returns an empty array when the clicked feature is not a Point', () => {
    const map = createMockMap({
      exactFeatures: [
        { properties: { id: 1 }, geometry: { type: 'Polygon', coordinates: [0, 0] } },
      ],
    })
    expect(detectVisualOverlaps(map, { x: 0, y: 0 }, 'layer')).toEqual([])
  })

  it('excludes markers outside the pixel tolerance', () => {
    const map = createMockMap({
      exactFeatures: [feature(1, [0, 0])],
      areaFeatures: [feature(1, [0, 0]), feature(2, [10, 10])],
    })
    const result = detectVisualOverlaps(map, { x: 0, y: 0 }, 'layer')
    expect(result).toEqual([{ id: 1, location: { lng: 0, lat: 0 }, status: 0, priority: 0 }])
  })

  it('includes markers within tolerance, defaulting status/priority and carrying typeKey when present', () => {
    const map = createMockMap({
      exactFeatures: [feature(1, [0, 0])],
      areaFeatures: [
        feature(1, [0, 0]),
        feature(2, [1, 1], { status: 3, priority: 2, typeKey: 'building' }),
      ],
    })
    const result = detectVisualOverlaps(map, { x: 0, y: 0 }, 'layer')
    expect(result).toEqual([
      { id: 1, location: { lng: 0, lat: 0 }, status: 0, priority: 0 },
      {
        id: 2,
        location: { lng: 1, lat: 1 },
        status: 3,
        priority: 2,
        typeKey: 'building',
      },
    ])
  })

  it('deduplicates markers that appear more than once in the area query', () => {
    const map = createMockMap({
      exactFeatures: [feature(1, [0, 0])],
      areaFeatures: [feature(1, [0, 0]), feature(1, [0, 0])],
    })
    expect(detectVisualOverlaps(map, { x: 0, y: 0 }, 'layer')).toHaveLength(1)
  })

  it('skips area features missing an id or that are not Points', () => {
    const map = createMockMap({
      exactFeatures: [feature(99, [0, 0])],
      areaFeatures: [
        { properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
        { properties: { id: 2 }, geometry: { type: 'LineString', coordinates: [0, 0] } },
      ],
    })
    expect(detectVisualOverlaps(map, { x: 0, y: 0 }, 'layer')).toEqual([])
  })

  it('honors a custom pixelTolerance', () => {
    const map = createMockMap({
      exactFeatures: [feature(1, [0, 0])],
      areaFeatures: [feature(1, [0, 0]), feature(2, [3, 0])],
    })
    expect(detectVisualOverlaps(map, { x: 0, y: 0 }, 'layer')).toHaveLength(1)
    expect(detectVisualOverlaps(map, { x: 0, y: 0 }, 'layer', 5)).toHaveLength(2)
  })

  it('accepts an array of layer ids', () => {
    const queriedLayers: unknown[] = []
    const exact = [feature(1, [0, 0])]
    const area = [feature(1, [0, 0])]
    const map = {
      queryRenderedFeatures: (geometry: unknown, options: { layers: unknown }) => {
        queriedLayers.push(options.layers)
        const isBoxQuery = Array.isArray(geometry) && Array.isArray(geometry[0])
        return isBoxQuery ? area : exact
      },
      project: (lngLat: [number, number]) => ({ x: lngLat[0], y: lngLat[1] }),
      unproject: (point: [number, number]) => ({ lng: point[0], lat: point[1] }),
    } as unknown as maplibregl.Map

    const result = detectVisualOverlaps(map, { x: 0, y: 0 }, ['layer-a', 'layer-b'])

    expect(result).toHaveLength(1)
    expect(queriedLayers).toEqual([
      ['layer-a', 'layer-b'],
      ['layer-a', 'layer-b'],
    ])
  })
})

describe('createSpiderGroup', () => {
  const map = createMockMap()

  it('returns an empty map when there are no markers', () => {
    expect(createSpiderGroup([], [0, 0], map).size).toBe(0)
  })

  it('offsets a single marker straight up from the click point', () => {
    const m = marker(1, 5, 5)
    const result = createSpiderGroup([m], [5, 5], map)
    expect(result.get(1)).toEqual({
      original: [5, 5],
      spidered: [5, 5 - CLUSTER_ICON_PIXELS / 2],
    })
  })

  it('lays out 8 or fewer markers on a circle', () => {
    const markers = [marker(1, 0, 0), marker(2, 1, 1)]
    const centerPointPx = { x: 10, y: 10 }
    const result = createSpiderGroup(markers, [centerPointPx.x, centerPointPx.y], map)

    const circumferencePx = (CLUSTER_ICON_PIXELS / 2) * (2 + markers.length)
    const legLengthPx = circumferencePx / (Math.PI * 2)
    const angleStep = (Math.PI * 2) / markers.length

    markers.forEach((m, index) => {
      const angle = CIRCLE_START_ANGLE + index * angleStep
      const expected = result.get(m.id)
      expect(expected?.original).toEqual([m.location.lng, m.location.lat])
      expect(expected?.spidered[0]).toBeCloseTo(centerPointPx.x + legLengthPx * Math.cos(angle), 9)
      expect(expected?.spidered[1]).toBeCloseTo(centerPointPx.y + legLengthPx * Math.sin(angle), 9)
    })
  })

  it('switches to a spiral for more than 8 markers', () => {
    const markers = Array.from({ length: 9 }, (_, i) => marker(i + 1, i, i))
    const centerPointPx = { x: 10, y: 10 }
    const result = createSpiderGroup(markers, [centerPointPx.x, centerPointPx.y], map)

    let legLengthPx = SPIRAL_LENGTH_START
    let angle = 0

    markers.forEach((m, index) => {
      angle += SPIRAL_FOOT_SEPARATION / legLengthPx + index * 0.0005
      const expected = result.get(m.id)
      expect(expected?.original).toEqual([m.location.lng, m.location.lat])
      expect(expected?.spidered[0]).toBeCloseTo(centerPointPx.x + legLengthPx * Math.cos(angle), 9)
      expect(expected?.spidered[1]).toBeCloseTo(centerPointPx.y + legLengthPx * Math.sin(angle), 9)
      legLengthPx += (Math.PI * 2 * SPIRAL_LENGTH_FACTOR) / angle
    })
  })

  it('uses the circle layout at exactly the 8-marker boundary, not the spiral', () => {
    const markers = Array.from({ length: 8 }, (_, i) => marker(i + 1, i, i))
    const centerPointPx = { x: 0, y: 0 }
    const result = createSpiderGroup(markers, [centerPointPx.x, centerPointPx.y], map)

    const circumferencePx = (CLUSTER_ICON_PIXELS / 2) * (2 + markers.length)
    const legLengthPx = circumferencePx / (Math.PI * 2)
    const angle = CIRCLE_START_ANGLE

    const first = result.get(1)
    expect(first?.spidered[0]).toBeCloseTo(centerPointPx.x + legLengthPx * Math.cos(angle), 9)
    expect(first?.spidered[1]).toBeCloseTo(centerPointPx.y + legLengthPx * Math.sin(angle), 9)
  })
})
