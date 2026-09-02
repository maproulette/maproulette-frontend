import type maplibregl from 'maplibre-gl'
import type { Bbox2D } from '@/types/Map'

/**
 * Valid geographic coordinate limits
 * Using slightly inside the theoretical limits to avoid strict validation errors
 */
const MAX_LON = 180
const MIN_LON = -180
const MAX_LAT = 85
const MIN_LAT = -85

/**
 * Default world bounds string
 */
export const DEFAULT_WORLD_BOUNDS = `${MIN_LON},${MIN_LAT},${MAX_LON},${MAX_LAT}`

/**
 * Check if a bounds string represents world bounds (default/no specific bounds)
 * Handles both old (-180,-90,180,90) and new format
 */
export const isWorldBounds = (boundsString: string | undefined): boolean => {
  if (!boundsString) return true

  const parts = boundsString.split(',').map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) return false
  const [west, south, east, north] = parts
  return west <= MIN_LON && south <= MIN_LAT && east >= MAX_LON && north >= MAX_LAT
}

/**
 * Clamp a value between min and max
 */
const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value))

/**
 * Clamp a bounds string to valid geographic ranges
 * Format: "west,south,east,north"
 * Returns clamped bounds string or the default world bounds if invalid
 */
export const clampBoundsString = (boundsString: string): string => {
  const parts = boundsString.split(',').map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return `${MIN_LON},${MIN_LAT},${MAX_LON},${MAX_LAT}`
  }
  return [
    clamp(parts[0], MIN_LON, MAX_LON),
    clamp(parts[1], MIN_LAT, MAX_LAT),
    clamp(parts[2], MIN_LON, MAX_LON),
    clamp(parts[3], MIN_LAT, MAX_LAT),
  ].join(',')
}

/**
 * Turn a "west,south,east,north" bounds string into a GeoJSON Polygon ring.
 * Used as the place-boundary filter for locations Nominatim has no polygon
 * for, and while a real boundary is still being fetched.
 */
export const boundsStringToPolygon = (
  boundsString: string
): { type: 'Polygon'; coordinates: number[][][] } | null => {
  // Validate before clamping: clampBoundsString turns a malformed string into
  // world bounds, which would read as a place covering the planet.
  const raw = boundsString.split(',').map(Number)
  if (raw.length !== 4 || raw.some(Number.isNaN)) return null
  const [west, south, east, north] = clampBoundsString(boundsString).split(',').map(Number)
  return {
    type: 'Polygon',
    coordinates: [
      [
        [west, south],
        [east, south],
        [east, north],
        [west, north],
        [west, south],
      ],
    ],
  }
}

/**
 * Intersect two "west,south,east,north" bounds strings. Returns null when they
 * don't overlap at all -- there is no box that means "nothing", so callers have
 * to treat that as an empty result rather than passing a box along.
 */
export const intersectBoundsStrings = (a: string, b: string): string | null => {
  const first = parseBoundsString(a)
  const second = parseBoundsString(b)
  if (!first || !second) return null

  const west = Math.max(first[0], second[0])
  const south = Math.max(first[1], second[1])
  const east = Math.min(first[2], second[2])
  const north = Math.min(first[3], second[3])
  if (west >= east || south >= north) return null

  return [west, south, east, north].join(',')
}

/**
 * Convert maplibre LngLatBounds to a [west, south, east, north] tuple.
 */
export const mapBoundsToBbox = (bounds: maplibregl.LngLatBounds): Bbox2D => {
  return [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
}

/**
 * Returns true if `coord` falls inside `bbox` or exactly on its boundary.
 */
export function coordInBbox(coord: [number, number], bbox: Bbox2D): boolean {
  const [lng, lat] = coord
  const [west, south, east, north] = bbox
  return lng >= west && lng <= east && lat >= south && lat <= north
}

/**
 * Get the current map bounds as a comma-separated string
 * Format: "west,south,east,north"
 * Values are clamped to valid geographic ranges
 */
export const getMapBoundsString = (map: maplibregl.Map): string => {
  const [west, south, east, north] = mapBoundsToBbox(map.getBounds())
  const clamped: Bbox2D = [
    clamp(west, MIN_LON, MAX_LON),
    clamp(south, MIN_LAT, MAX_LAT),
    clamp(east, MIN_LON, MAX_LON),
    clamp(north, MIN_LAT, MAX_LAT),
  ]
  return clamped.join(',')
}

/**
 * Parse a bounds string into a bounds array
 * Format: "west,south,east,north" => [west, south, east, north]
 * Values are clamped to valid geographic ranges
 */
export const parseBoundsString = (boundsString: string): Bbox2D | null => {
  const parts = boundsString.split(',').map(Number)
  if (parts.length !== 4 || parts.some(Number.isNaN)) {
    return null
  }

  return [
    clamp(parts[0], MIN_LON, MAX_LON),
    clamp(parts[1], MIN_LAT, MAX_LAT),
    clamp(parts[2], MIN_LON, MAX_LON),
    clamp(parts[3], MIN_LAT, MAX_LAT),
  ]
}

/**
 * Compare two bounds strings to see if they're effectively the same
 * Uses a tolerance to account for floating point precision differences
 * @param bounds1 First bounds string
 * @param bounds2 Second bounds string
 * @param tolerance Tolerance in degrees (default: 0.0001, approximately 11 meters)
 * @returns true if bounds are within tolerance
 */
export const boundsAreEqual = (
  bounds1: string,
  bounds2: string,
  tolerance: number = 0.0001
): boolean => {
  const parsed1 = parseBoundsString(bounds1)
  const parsed2 = parseBoundsString(bounds2)

  if (!parsed1 || !parsed2) {
    return bounds1 === bounds2
  }

  const [west1, south1, east1, north1] = parsed1
  const [west2, south2, east2, north2] = parsed2

  return (
    Math.abs(west1 - west2) < tolerance &&
    Math.abs(south1 - south2) < tolerance &&
    Math.abs(east1 - east2) < tolerance &&
    Math.abs(north1 - north2) < tolerance
  )
}

/**
 * Reset map to default view
 */
export const resetMapView = (
  map: maplibregl.Map,
  center: [number, number] = [0, 0],
  zoom: number = 2
) => {
  map.jumpTo({
    center,
    zoom,
  })
}
