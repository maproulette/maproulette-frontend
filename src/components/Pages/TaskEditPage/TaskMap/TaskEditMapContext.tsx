import { useQuery } from '@tanstack/react-query'
import { createContext, type ReactNode, useContext, useMemo, useState } from 'react'
import { z } from 'zod'
import { challengeTaskMarkersOptions } from '@/api/challenge'
import { useClustering } from '@/components/Map/TaskMarkers/ClusterToggle'
import { flattenTaskMarkers } from '@/components/Map/TaskMarkers/utils'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { localStored, useStored } from '@/lib/storage'
import type { TaskEditMapContextType } from './taskEditMapTypes'
import { useInitialMapBounds } from './useInitialMapBounds'
import { useMapViewport } from './useMapViewport'

const TaskEditMapContext = createContext<TaskEditMapContextType | null>(null)

const showOtherChallenges = localStored('taskMap.showOtherChallenges', z.boolean(), false)

export const TaskEditMapProvider = ({ children }: { children: ReactNode }) => {
  const { task } = useTaskContext()
  const { map: mapRef } = useTaskMapContext()
  const { showBundleOnly, activeBundle } = useTaskBundleContext()

  const [mapLoaded, setMapLoaded] = useState(false)
  const [showExploreLayer, setShowExploreLayer] = useStored(showOtherChallenges)

  const { data: taskMarkersData, isLoading: isLoadingMarkers } = useQuery(
    challengeTaskMarkersOptions(task.parent)
  )

  const allMarkers = useMemo(() => flattenTaskMarkers(taskMarkersData), [taskMarkersData])
  const [isClustered, setIsClustered] = useClustering(allMarkers.length)

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
