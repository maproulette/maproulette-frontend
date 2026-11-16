import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import type { TaskMarker } from '@/types/Task'

/**
 * Find all task markers within a polygon.
 */
export const getTasksInPolygon = (markers: TaskMarker[], polygon: GeoJSON.Polygon): number[] => {
  return markers
    .filter((marker) => {
      if (!marker.location) return false
      return booleanPointInPolygon([marker.location.lng, marker.location.lat], polygon)
    })
    .map((marker) => marker.id)
}
