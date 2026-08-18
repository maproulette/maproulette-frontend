import type maplibregl from 'maplibre-gl'
import { describe, expect, it, vi } from 'vitest'
import type { Bbox2D } from '@/types/Map'
import {
  boundsAreEqual,
  clampBoundsString,
  coordInBbox,
  DEFAULT_WORLD_BOUNDS,
  getMapBoundsString,
  isWorldBounds,
  parseBoundsString,
  resetMapView,
} from './mapUtils.ts'

const BBOX: Bbox2D = [-100, 30, -90, 40]

describe('coordInBbox', () => {
  it('returns true for a coordinate inside the bbox', () => {
    expect(coordInBbox([-95, 35], BBOX)).toBe(true)
  })

  it('returns false for a coordinate outside the bbox', () => {
    expect(coordInBbox([-80, 35], BBOX)).toBe(false)
    expect(coordInBbox([-95, 50], BBOX)).toBe(false)
  })

  it('treats the boundary as inside', () => {
    expect(coordInBbox([-100, 35], BBOX)).toBe(true)
    expect(coordInBbox([-90, 35], BBOX)).toBe(true)
    expect(coordInBbox([-95, 30], BBOX)).toBe(true)
    expect(coordInBbox([-95, 40], BBOX)).toBe(true)
  })

  it('treats the corners as inside', () => {
    expect(coordInBbox([-100, 30], BBOX)).toBe(true)
    expect(coordInBbox([-100, 40], BBOX)).toBe(true)
    expect(coordInBbox([-90, 30], BBOX)).toBe(true)
    expect(coordInBbox([-90, 40], BBOX)).toBe(true)
  })

  it('correctly handles coordinates just inside or outside the bbox', () => {
    expect(coordInBbox([-99.9999, 35], BBOX)).toBe(true)
    expect(coordInBbox([-90.0001, 35], BBOX)).toBe(true)
    expect(coordInBbox([-100.0001, 35], BBOX)).toBe(false)
    expect(coordInBbox([-89.9999, 35], BBOX)).toBe(false)
  })
})

describe('isWorldBounds', () => {
  it('is true for undefined or an empty string', () => {
    expect(isWorldBounds(undefined)).toBe(true)
    expect(isWorldBounds('')).toBe(true)
  })

  it('is true for the DEFAULT_WORLD_BOUNDS constant and the legacy -90/90 string', () => {
    // These two inputs used to be special-cased with early returns; the
    // general numeric fallback check below must still classify both as
    // world bounds after that dead code was removed.
    expect(isWorldBounds(DEFAULT_WORLD_BOUNDS)).toBe(true)
    expect(isWorldBounds('-180,-90,180,90')).toBe(true)
  })

  it('is true for bounds wider than the world', () => {
    expect(isWorldBounds('-200,-100,200,100')).toBe(true)
  })

  it('is false for a restricted, non-world bounds string', () => {
    expect(isWorldBounds('-100,30,-90,40')).toBe(false)
  })

  it('is false for a malformed bounds string with the wrong number of parts', () => {
    expect(isWorldBounds('-180,-85,180')).toBe(false)
    expect(isWorldBounds('-180,-85,180,85,0')).toBe(false)
  })

  it('is false for a bounds string with non-numeric parts', () => {
    expect(isWorldBounds('a,b,c,d')).toBe(false)
    expect(isWorldBounds('-180,-85,180,nope')).toBe(false)
  })
})

describe('clampBoundsString', () => {
  it('leaves an already in-range bounds string unchanged', () => {
    expect(clampBoundsString('-100,30,-90,40')).toBe('-100,30,-90,40')
  })

  it('clamps out-of-range values to the valid geographic ranges', () => {
    expect(clampBoundsString('-200,-100,200,100')).toBe('-180,-85,180,85')
  })

  it('clamps only the values that are out of range', () => {
    expect(clampBoundsString('-200,30,-90,100')).toBe('-180,30,-90,85')
  })

  it('returns the default world bounds for a malformed string (wrong part count)', () => {
    expect(clampBoundsString('-100,30,-90')).toBe(DEFAULT_WORLD_BOUNDS)
  })

  it('returns the default world bounds for a malformed string (non-numeric parts)', () => {
    expect(clampBoundsString('a,b,c,d')).toBe(DEFAULT_WORLD_BOUNDS)
  })
})

describe('parseBoundsString', () => {
  it('parses a valid in-range bounds string into a tuple', () => {
    expect(parseBoundsString('-100,30,-90,40')).toEqual([-100, 30, -90, 40])
  })

  it('clamps out-of-range values while parsing', () => {
    expect(parseBoundsString('-200,-100,200,100')).toEqual([-180, -85, 180, 85])
  })

  it('returns null for a malformed string with the wrong number of parts', () => {
    expect(parseBoundsString('-100,30,-90')).toBeNull()
  })

  it('returns null for a malformed string with non-numeric parts', () => {
    expect(parseBoundsString('a,b,c,d')).toBeNull()
  })
})

describe('boundsAreEqual', () => {
  it('is true for identical bounds strings', () => {
    expect(boundsAreEqual('-100,30,-90,40', '-100,30,-90,40')).toBe(true)
  })

  it('is true for values within the default tolerance', () => {
    expect(boundsAreEqual('-100,30,-90,40', '-100.00005,30.00005,-90.00005,40.00005')).toBe(true)
  })

  it('is false for values outside the default tolerance', () => {
    expect(boundsAreEqual('-100,30,-90,40', '-100.001,30,-90,40')).toBe(false)
  })

  it('respects a custom tolerance', () => {
    expect(boundsAreEqual('-100,30,-90,40', '-100.05,30,-90,40', 0.1)).toBe(true)
    expect(boundsAreEqual('-100,30,-90,40', '-100.05,30,-90,40', 0.01)).toBe(false)
  })

  it('falls back to string equality when either bounds string is unparsable', () => {
    expect(boundsAreEqual('not-a-bounds-string', 'not-a-bounds-string')).toBe(true)
    expect(boundsAreEqual('not-a-bounds-string', '-100,30,-90,40')).toBe(false)
    expect(boundsAreEqual('-100,30,-90,40', 'still-not-a-bounds-string')).toBe(false)
  })
})

describe('getMapBoundsString', () => {
  const createMockMap = (bounds: {
    west: number
    south: number
    east: number
    north: number
  }): maplibregl.Map => {
    const map = {
      getBounds: () => ({
        getWest: () => bounds.west,
        getSouth: () => bounds.south,
        getEast: () => bounds.east,
        getNorth: () => bounds.north,
      }),
    }
    return map as unknown as maplibregl.Map
  }

  it('formats the current map bounds as a comma-separated string', () => {
    const map = createMockMap({ west: -100, south: 30, east: -90, north: 40 })
    expect(getMapBoundsString(map)).toBe('-100,30,-90,40')
  })

  it('clamps out-of-range map bounds to the valid geographic ranges', () => {
    const map = createMockMap({ west: -200, south: -100, east: 200, north: 100 })
    expect(getMapBoundsString(map)).toBe('-180,-85,180,85')
  })
})

describe('resetMapView', () => {
  const createMockMap = (): { jumpTo: ReturnType<typeof vi.fn> } => ({
    jumpTo: vi.fn(),
  })

  it('jumps to the world center at zoom 2 by default', () => {
    const map = createMockMap()
    resetMapView(map as unknown as maplibregl.Map)
    expect(map.jumpTo).toHaveBeenCalledWith({ center: [0, 0], zoom: 2 })
  })

  it('jumps to a given center and zoom', () => {
    const map = createMockMap()
    resetMapView(map as unknown as maplibregl.Map, [-100, 40], 8)
    expect(map.jumpTo).toHaveBeenCalledWith({ center: [-100, 40], zoom: 8 })
  })
})
