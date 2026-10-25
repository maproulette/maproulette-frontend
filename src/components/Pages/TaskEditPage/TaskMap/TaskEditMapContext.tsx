import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { api } from '@/api'
import { flattenTaskMarkers } from '@/components/Map/TaskMarkers/utils'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import type { TaskEditMapContextType } from './taskEditMapTypes'
import { useInitialMapBounds } from './useInitialMapBounds'
import { useMapViewport } from './useMapViewport'

const TaskEditMapContext = createContext<TaskEditMapContextType | null>(null)

export const TaskEditMapProvider = ({ children }: { children: ReactNode }) => {
  const { task } = useTaskContext()
  const { map: mapRef } = useTaskMapContext()
  const { showBundleOnly, activeBundle } = useTaskBundleContext()

  const [mapLoaded, setMapLoaded] = useState(false)
  const [isClustered, setIsClustered] = useState<boolean>(true)
  const [showExploreLayer, setShowExploreLayer] = useState<boolean>(false)

  const { data: taskMarkersData, isLoading: isLoadingMarkers } =
    api.challenge.getChallengeTaskMarkers(task.parent)

  const allMarkers = useMemo(() => flattenTaskMarkers(taskMarkersData), [taskMarkersData])

  const markers = useMemo(() => {
    if (!showBundleOnly) return allMarkers
    const shown = new Set([task.id, ...(activeBundle?.taskIds ?? [])])
    return allMarkers.filter((marker) => shown.has(marker.id))
  }, [allMarkers, showBundleOnly, activeBundle?.taskIds, task.id])

  const markersById = useMemo(() => new Map(markers.map((m) => [m.id, m])), [markers])

  const { mapBounds, mapZoom } = useMapViewport(mapLoaded)

  const initialBoundsApplied = useInitialMapBounds(mapLoaded, isLoadingMarkers)

  const value = useMemo(
    () => ({
      mapRef,
      mapLoaded,
      setMapLoaded,
      mapBounds,
      mapZoom,
      markers,
      markersById,
      isLoadingMarkers,
      isClustered,
      setIsClustered,
      initialBoundsApplied,
      showExploreLayer,
      setShowExploreLayer,
    }),
    [
      mapRef,
      mapLoaded,
      mapBounds,
      mapZoom,
      markers,
      markersById,
      isLoadingMarkers,
      isClustered,
      initialBoundsApplied,
      showExploreLayer,
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
