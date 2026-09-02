import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import type { SpideredMarkers, TaskEditMapContextType } from './taskEditMapTypes'
import { useClusteredGeoJSONData } from './useClusteredGeoJSONData'
import { useInitialMapBounds } from './useInitialMapBounds'
import { useMapViewport } from './useMapViewport'
import { useMarkerIconsVersion } from './useMarkerIconsVersion'
import { useSuperclusterIndex } from './useSuperclusterIndex'
import { useTaskMapInteractions } from './useTaskMapInteractions'
import { useTaskMarkerData } from './useTaskMarkerData'
import { useTaskPointFeatures } from './useTaskPointFeatures'

const TaskEditMapContext = createContext<TaskEditMapContextType | null>(null)

export const TaskEditMapProvider = ({ children }: { children: ReactNode }) => {
  const { task } = useTaskContext()
  const { map: mapRef } = useTaskMapContext()

  const [mapLoaded, setMapLoaded] = useState(false)
  const [isClustered, setIsClustered] = useState<boolean>(true)
  const [showExploreLayer, setShowExploreLayer] = useState<boolean>(false)
  const [spideredMarkers, setSpideredMarkers] = useState<SpideredMarkers>(new Map())

  const primaryTaskId = task.id
  const shouldCluster = true

  const {
    isLoadingMarkers,
    taskCount,
    markersData,
    bundleTaskIdsSet,
    bundleFilterIds,
    overlapData,
    overlappingTaskIds,
    overlapGroupsMap,
  } = useTaskMarkerData()

  const { geoJSONData, pointFeatures } = useTaskPointFeatures(
    markersData,
    overlapData,
    overlappingTaskIds,
    bundleFilterIds
  )

  const { mapBounds, mapZoom } = useMapViewport(mapLoaded)

  const { superclusterIndex, superclusterRef, isClusteringForced } = useSuperclusterIndex(
    pointFeatures,
    isClustered,
    mapZoom
  )

  const iconsVersion = useMarkerIconsVersion(mapLoaded, shouldCluster)

  const clusteredGeoJSONData = useClusteredGeoJSONData(
    superclusterIndex,
    mapBounds,
    mapZoom,
    iconsVersion,
    spideredMarkers,
    bundleTaskIdsSet,
    overlapGroupsMap
  )

  const initialBoundsApplied = useInitialMapBounds(mapLoaded, isLoadingMarkers)

  const { onMapClick, onMouseMove } = useTaskMapInteractions(
    markersData,
    overlapGroupsMap,
    superclusterRef,
    setSpideredMarkers,
    shouldCluster
  )

  const value = useMemo(
    () => ({
      mapRef,
      mapLoaded,
      setMapLoaded,
      taskCount,
      shouldCluster,
      markersData,
      overlapData,
      isLoadingMarkers,
      onMapClick,
      onMouseMove,
      isClustered,
      setIsClustered,
      geoJSONData,
      clusteredGeoJSONData,
      primaryTaskId,
      spideredMarkers,
      setSpideredMarkers,
      isClusteringForced,
      initialBoundsApplied,
      mapBounds,
      mapZoom,
      showExploreLayer,
      setShowExploreLayer,
    }),
    [
      mapRef,
      mapLoaded,
      taskCount,
      shouldCluster,
      markersData,
      overlapData,
      isLoadingMarkers,
      onMapClick,
      onMouseMove,
      isClustered,
      geoJSONData,
      clusteredGeoJSONData,
      primaryTaskId,
      spideredMarkers,
      isClusteringForced,
      initialBoundsApplied,
      showExploreLayer,
      mapBounds,
      mapZoom,
    ]
  )

  return <TaskEditMapContext.Provider value={value}>{children}</TaskEditMapContext.Provider>
}

/**
 * The task map's state where there is one, or null. The task info panel is also
 * rendered in places with no task map (challenge browsing, the prioritization
 * preview), so it reads the viewport through this rather than the throwing
 * accessor below.
 */
export const useOptionalTaskEditMapContext = () => useContext(TaskEditMapContext)

export const useTaskEditMapContext = () => {
  const context = useContext(TaskEditMapContext)
  if (!context) {
    throw new Error('useTaskEditMapContext must be used within a TaskEditMapProvider')
  }
  return context
}
