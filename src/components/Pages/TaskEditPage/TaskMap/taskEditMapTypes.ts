import type { MapRef } from 'react-map-gl/maplibre'
import type { Bbox2D } from '@/types/Map'
import type { TaskMarker } from '@/types/Task'

export interface TaskEditMapContextType {
  mapRef: React.RefObject<MapRef | null>
  mapLoaded: boolean
  setMapLoaded: (loaded: boolean) => void
  /** Viewport as of the last time the map stopped moving, for the `#`-prefixed workspace mustache properties. */
  mapBounds: Bbox2D
  mapZoom: number
  markers: TaskMarker[]
  markersById: ReadonlyMap<number, TaskMarker>
  isLoadingMarkers: boolean
  isClustered: boolean
  setIsClustered: (clustered: boolean) => void
  initialBoundsApplied: boolean
  showExploreLayer: boolean
  setShowExploreLayer: (show: boolean) => void
}
