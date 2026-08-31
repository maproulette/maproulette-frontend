import type { TaskMarker } from '@/types/Task'

// Task status codes
export const TASK_STATUS = {
  CREATED: 0,
  FIXED: 1,
  FALSE_POSITIVE: 2,
  SKIPPED: 3,
  DELETED: 4,
  ALREADY_FIXED: 5,
  TOO_HARD: 6,
} as const

// Statuses eligible for bundling: Created, Skipped, Too Hard (Can't Complete)
export const BUNDLE_ELIGIBLE_STATUSES: Set<number> = new Set([
  TASK_STATUS.CREATED,
  TASK_STATUS.SKIPPED,
  TASK_STATUS.TOO_HARD,
])

/**
 * Checks if a task marker is eligible to be added to a bundle.
 * A task is eligible if:
 * - It's not locked by another user (lockedBy is null/undefined or matches currentUserId)
 * - Its bundleId matches the primary task's bundleId (or both are null/undefined)
 * - Its status is Created (0), Skipped (3), or Too Hard/Can't Complete (6)
 */
export const isTaskEligibleForBundle = (
  marker: { status: number; bundleId?: number | null; lockedBy?: number | null },
  primaryTaskBundleId: number | null | undefined,
  currentUserId: number | null | undefined
): boolean => {
  // Check if task is locked by another user
  if (marker.lockedBy != null && currentUserId != null && marker.lockedBy !== currentUserId) {
    return false
  }

  // Check if bundleId matches (null/undefined treated as "no bundle")
  const markerBundleId = marker.bundleId ?? null
  const primaryBundleId = primaryTaskBundleId ?? null
  if (markerBundleId !== primaryBundleId) {
    return false
  }

  // Check if status is eligible for bundling
  if (!BUNDLE_ELIGIBLE_STATUSES.has(marker.status)) {
    return false
  }

  return true
}

/**
 * Builds the 1-feature overlay collection for the selected task, used by the maps
 * that render selection as a separate top overlay. Empty when nothing is selected
 * or the marker is spidered (SpiderMarkers draws the -selected variant then).
 */
export const buildSelectedTaskCollection = (
  marker: TaskMarker | null | undefined,
  spidered: { has: (id: number) => boolean }
): GeoJSON.FeatureCollection => {
  if (!marker?.location || spidered.has(marker.id)) {
    return { type: 'FeatureCollection', features: [] }
  }
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [marker.location.lng, marker.location.lat] },
        properties: { id: marker.id, status: marker.status, priority: marker.priority },
      },
    ],
  }
}

export const convertTaskMarkersToGeoJSON = (markers: TaskMarker[]): GeoJSON.FeatureCollection => {
  const features: GeoJSON.Feature[] = markers
    .map((marker): GeoJSON.Feature | null => {
      if (!marker.location) return null

      const properties: Record<string, unknown> = {
        id: marker.id,
        status: marker.status,
        priority: marker.priority,
        bundleId: marker.bundleId ?? null,
        lockedBy: marker.lockedBy ?? null,
        cluster: false,
        isOverlapping: false,
        isSelected: false,
        isHovered: false,
        isHighlighted: false,
      }

      return {
        type: 'Feature',
        properties,
        geometry: {
          type: 'Point',
          coordinates: [marker.location.lng, marker.location.lat],
        },
      } as GeoJSON.Feature
    })
    .filter((f): f is GeoJSON.Feature => f !== null)

  return {
    type: 'FeatureCollection',
    features,
  }
}

export const calculateTaskCount = (taskMarkersData: unknown): number => {
  if (
    typeof taskMarkersData !== 'object' ||
    taskMarkersData === null ||
    !('markers' in taskMarkersData) ||
    !Array.isArray((taskMarkersData as { markers?: unknown }).markers)
  ) {
    return 0
  }

  return (taskMarkersData as { markers: unknown[] }).markers.length
}

export const processMarkersData = (
  taskMarkersData: unknown
): {
  markers: TaskMarker[]
  overlapMarkers: Array<{ tasks: TaskMarker[]; location: { lng: number; lat: number } }>
} => {
  if (
    typeof taskMarkersData !== 'object' ||
    taskMarkersData === null ||
    !('markers' in taskMarkersData) ||
    !('overlaps' in taskMarkersData)
  ) {
    return { markers: [], overlapMarkers: [] }
  }

  const data = taskMarkersData as {
    markers?: unknown
    overlaps?: unknown
  }

  const markers = Array.isArray(data.markers) ? (data.markers as TaskMarker[]) : []

  const overlapMarkers = Array.isArray(data.overlaps)
    ? (data.overlaps as Array<{ tasks: TaskMarker[]; location: { lng: number; lat: number } }>)
    : []

  return { markers, overlapMarkers }
}

export const isValidLocation = (
  location: { lng: number; lat: number } | null | undefined
): boolean => {
  return (
    location != null &&
    typeof location.lng === 'number' &&
    typeof location.lat === 'number' &&
    !Number.isNaN(location.lng) &&
    !Number.isNaN(location.lat) &&
    Number.isFinite(location.lng) &&
    Number.isFinite(location.lat)
  )
}
