import bbox from '@turf/bbox'
import { useEffect, useRef, useState } from 'react'
import { api } from '@/api'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { decorateTaskFeatures } from '@/lib/decorateTaskFeatures'
import type { Bbox2D } from '@/types/Map'

/**
 * Fits the map to the task's (or bundle's) geometry bounds once per task: when
 * the map first loads and marker data has finished loading, and again whenever
 * the mapper moves to the next task, since the map is not remounted for them.
 * The very first fit is skipped when the URL already has a hash (MapLibre's
 * `hash` option has already restored a viewport) so we don't fight that
 * restored position.
 *
 * Returns whether the *first* fit has happened - the map is faded in behind it,
 * and that only needs to happen once, not on every task.
 */
export const useInitialMapBounds = (mapLoaded: boolean, isLoadingMarkers: boolean) => {
  const { map: mapRef } = useTaskMapContext()
  const { task } = useTaskContext()
  const { data: fullTaskData } = api.task.getTask(task.id)

  const fittedTaskIdRef = useRef<number | null>(null)
  const [initialBoundsApplied, setInitialBoundsApplied] = useState(false)

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    if (fittedTaskIdRef.current === task.id) return

    const isFirstFit = fittedTaskIdRef.current === null

    if (isFirstFit && window.location.hash.length > 1) {
      fittedTaskIdRef.current = task.id
      setInitialBoundsApplied(true)
      return
    }

    if (isLoadingMarkers) return

    const map = mapRef.current.getMap()
    if (!map) return

    const taskWithGeometries = fullTaskData ?? task
    const geometries = decorateTaskFeatures(taskWithGeometries)
    map.fitBounds(bbox(geometries) as Bbox2D, {
      padding: 400,
      // Only the opening view flies in. Moving to the next task lands on it
      // immediately - an animation there is just a wait before mapping.
      duration: isFirstFit ? 5000 : 0,
      maxZoom: 18,
    })
    fittedTaskIdRef.current = task.id
    setInitialBoundsApplied(true)
  }, [mapLoaded, isLoadingMarkers, task, fullTaskData])

  return initialBoundsApplied
}
