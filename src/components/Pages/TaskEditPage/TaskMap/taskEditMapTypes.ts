import type { MapMouseEvent, MapRef } from 'react-map-gl/maplibre'
import type { Bbox2D } from '@/types/Map'
import type { TaskMarker } from '@/types/Task'

export interface ClusterProperties {
  cluster: true
  cluster_id: number
  point_count: number
  point_count_abbreviated: string
  taskCount?: number
}

export interface PointProperties {
  cluster?: false
  id: number
  status: number
  priority: number
  bundleId?: number | null
  lockedBy?: number | null
  isLassoSelected?: boolean
  isOverlapping?: boolean
  isEligibleForBundle?: boolean
  distanceToPrimary?: number
  overlapId?: string
  overlapTaskCount?: number
}

/** A group of tasks that share (approximately) the same location, rendered as
 * a single overlap marker until the user spiders it apart. */
export interface OverlapGroup {
  center: [number, number]
  tasks: TaskMarker[]
}

export type OverlapGroupsMap = Map<string, OverlapGroup>

/** Maps a spidered task id to its original (clustered) position and its
 * spread-out (spidered) position. */
export type SpideredMarkers = Map<
  number,
  { original: [number, number]; spidered: [number, number] }
>

export interface TaskEditMapContextType {
  mapRef: React.RefObject<MapRef | null>
  mapLoaded: boolean
  /** Current viewport, for the `#`-prefixed workspace mustache properties. */
  mapBounds: Bbox2D
  mapZoom: number
  setMapLoaded: (loaded: boolean) => void
  taskCount: number
  shouldCluster: boolean
  markersData: {
    markers: TaskMarker[]
    overlapMarkers: Array<{
      location: { lng: number; lat: number }
      tasks: TaskMarker[]
    }>
  }
  overlapData: {
    overlaps: Array<{
      id: string
      center: [number, number]
      tasks: TaskMarker[]
      radius: number
    }>
    nonOverlapping: never[]
  }
  isLoadingMarkers: boolean
  onMapClick: (e: MapMouseEvent) => void
  onMouseMove: (e: MapMouseEvent) => void
  isClustered: boolean
  setIsClustered: (clustered: boolean) => void
  geoJSONData: GeoJSON.FeatureCollection
  clusteredGeoJSONData: GeoJSON.FeatureCollection
  primaryTaskId: number
  spideredMarkers: SpideredMarkers
  setSpideredMarkers: React.Dispatch<React.SetStateAction<SpideredMarkers>>
  isClusteringForced: boolean
  initialBoundsApplied: boolean
  showExploreLayer: boolean
  setShowExploreLayer: (show: boolean) => void
}
