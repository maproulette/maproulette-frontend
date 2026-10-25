import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { isValidLocation } from '@/components/Map/TaskMarkers/utils'
import type { Bbox2D } from '@/types/Map'
import type { TaskMarker } from '@/types/Task'

interface FitOptions {
  padding: number
  duration: number
  maxZoom?: number
  skipWhenUrlHasView?: boolean
}

export const markersBounds = (markers: TaskMarker[]): Bbox2D | null => {
  let west = Infinity
  let south = Infinity
  let east = -Infinity
  let north = -Infinity
  for (const { location } of markers) {
    if (!isValidLocation(location)) continue
    west = Math.min(west, location.lng)
    south = Math.min(south, location.lat)
    east = Math.max(east, location.lng)
    north = Math.max(north, location.lat)
  }
  return Number.isFinite(west) ? [west, south, east, north] : null
}

export const useFitToMarkers = (
  mapRef: React.RefObject<MapRef | null>,
  mapLoaded: boolean,
  markers: TaskMarker[],
  isLoading: boolean,
  { padding, duration, maxZoom = 16, skipWhenUrlHasView = false }: FitOptions
) => {
  const bounds = useMemo(() => markersBounds(markers), [markers])
  const [urlHadView] = useState(() => skipWhenUrlHasView && window.location.hash.length > 1)
  const fittedRef = useRef(urlHadView)

  useEffect(() => {
    if (fittedRef.current || !mapLoaded || isLoading || !bounds) return
    mapRef.current?.fitBounds(bounds, { padding, duration, maxZoom })
    fittedRef.current = true
  }, [mapRef, mapLoaded, isLoading, bounds, padding, duration, maxZoom])

  const zoomToAll = useCallback(() => {
    if (bounds) mapRef.current?.fitBounds(bounds, { padding, duration: 1000, maxZoom })
  }, [mapRef, bounds, padding, maxZoom])

  return { zoomToAll: bounds ? zoomToAll : null }
}
