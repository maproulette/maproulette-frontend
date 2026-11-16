import bbox from '@turf/bbox'
import { useCallback, useEffect, useRef } from 'react'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import type { Bbox2D } from '@/types/Map'
import type { TaskMarker } from '@/types/Task'

export const useMapNavigation = (
  mapLoaded: boolean,
  markersById: ReadonlyMap<number, TaskMarker>
) => {
  const { map: mapRef } = useTaskMapContext()
  const { task } = useTaskContext()
  const { activeBundle } = useTaskBundleContext()
  const primaryTaskId = task.id

  // Track if we've already zoomed to the primary task for this task ID
  const lastZoomedTaskIdRef = useRef<number | null>(null)

  // Zoom to primary task when task changes or markers initially load
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    if (markersById.size === 0) return

    // Only zoom if we haven't already zoomed to this task
    if (lastZoomedTaskIdRef.current === primaryTaskId) return

    const primaryMarker = markersById.get(primaryTaskId)
    if (primaryMarker?.location) {
      mapRef.current.jumpTo({
        center: [primaryMarker.location.lng, primaryMarker.location.lat],
        zoom: 16,
      })
      lastZoomedTaskIdRef.current = primaryTaskId
    }
  }, [mapLoaded, primaryTaskId, markersById])

  // Reason: stable callback prevents map event listener re-registration
  const handleCenterToTask = useCallback(() => {
    if (!mapRef.current) return

    if (activeBundle && activeBundle.taskIds.length > 1) {
      // Center to bundle bounds
      const bundleMarkers = activeBundle.taskIds
        .map((id) => markersById.get(id))
        .filter((m): m is TaskMarker => m !== undefined && m.location !== undefined)

      if (bundleMarkers.length > 0) {
        const fc: GeoJSON.FeatureCollection<GeoJSON.Point> = {
          type: 'FeatureCollection',
          features: bundleMarkers.map((m) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [m.location.lng, m.location.lat] },
            properties: {},
          })),
        }
        mapRef.current.fitBounds(bbox(fc) as Bbox2D, { padding: 80, duration: 0, maxZoom: 16 })
        return
      }
    }

    // Center to primary task
    const primaryMarker = markersById.get(primaryTaskId)
    if (primaryMarker?.location) {
      mapRef.current.jumpTo({
        center: [primaryMarker.location.lng, primaryMarker.location.lat],
        zoom: 16,
      })
    }
  }, [mapRef, activeBundle, markersById, primaryTaskId])

  return { handleCenterToTask }
}
