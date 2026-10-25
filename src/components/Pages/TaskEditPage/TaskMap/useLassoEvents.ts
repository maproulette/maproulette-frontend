import { useEffect, useRef } from 'react'
import { isTaskEligibleForBundle } from '@/components/Map/TaskMarkers/utils'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import {
  MAX_SELECTED_TASKS,
  useTaskMapContext,
} from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { useAuthContext } from '@/contexts/AuthContext'
import type { TaskMarker } from '@/types/Task'
import { getTasksInPolygon } from './lassoUtils'
import { useTaskEditMapContext } from './TaskEditMapContext'

/**
 * Binds mouse event listeners for lasso drawing on the map canvas.
 * Reads/writes lasso state from TaskMapContext.
 * Must be called from a component that has access to markers data.
 */
export const useLassoEvents = () => {
  const {
    map: mapRef,
    drawingMode,
    setDrawingMode,
    setIsDrawing,
    setLassoPolygon,
    setSelectedTaskIds,
  } = useTaskMapContext()
  const { task } = useTaskContext()
  const { activeBundle } = useTaskBundleContext()
  const { user } = useAuthContext()

  const { markers } = useTaskEditMapContext()

  // Create a set of excluded task IDs (primary + bundled)
  const excludedIdsRef = useRef(new Set<number>())
  useEffect(() => {
    const excluded = new Set<number>()
    excluded.add(task.id)
    if (activeBundle?.taskIds) {
      for (const id of activeBundle.taskIds) excluded.add(id)
    }
    excludedIdsRef.current = excluded
  }, [task.id, activeBundle?.taskIds])

  // Set of task IDs in a bundleable state. Tasks that are not eligible render
  // as dimmed markers, so the lasso must skip them too — selecting them would
  // add tasks to the bundle that can never actually be bundled.
  const eligibleIdsRef = useRef(new Set<number>())
  useEffect(() => {
    const primaryTaskBundleId = task.bundleId ?? null
    const currentUserId = user?.id ?? null
    const eligible = new Set<number>()
    for (const marker of markers) {
      if (
        isTaskEligibleForBundle(
          { status: marker.status, bundleId: marker.bundleId, lockedBy: marker.lockedBy },
          primaryTaskBundleId,
          currentUserId
        )
      ) {
        eligible.add(marker.id)
      }
    }
    eligibleIdsRef.current = eligible
  }, [markers, task.bundleId, user?.id])

  const markersRef = useRef<TaskMarker[]>(markers)
  useEffect(() => {
    markersRef.current = markers
  }, [markers])

  const isMouseDownRef = useRef(false)
  const pointsRef = useRef<[number, number][]>([])
  const drawingModeRef = useRef(drawingMode)
  useEffect(() => {
    drawingModeRef.current = drawingMode
  }, [drawingMode])

  // Handle the lasso drawing with mouse events
  useEffect(() => {
    if (!mapRef.current || !drawingMode) return

    const map = mapRef.current.getMap()
    if (!map) return

    const canvas = map.getCanvas()

    const getCanvasCoords = (e: MouseEvent): { x: number; y: number } => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const handleMouseDown = (e: MouseEvent) => {
      if (!drawingModeRef.current || e.button !== 0) return

      isMouseDownRef.current = true
      const coords = getCanvasCoords(e)
      const lngLat = map.unproject([coords.x, coords.y])
      pointsRef.current = [[lngLat.lng, lngLat.lat]]
      setLassoPolygon([[lngLat.lng, lngLat.lat]])
      setIsDrawing(true)
      map.dragPan.disable()
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isMouseDownRef.current || !drawingModeRef.current) return

      const coords = getCanvasCoords(e)
      const lngLat = map.unproject([coords.x, coords.y])
      const newPoint: [number, number] = [lngLat.lng, lngLat.lat]

      const lastPoint = pointsRef.current[pointsRef.current.length - 1]
      if (lastPoint) {
        const projected = map.project(lastPoint)
        const dx = coords.x - projected.x
        const dy = coords.y - projected.y
        if (Math.sqrt(dx * dx + dy * dy) < 3) return
      }

      pointsRef.current.push(newPoint)
      setLassoPolygon([...pointsRef.current])
    }

    const handleMouseUp = () => {
      if (!isMouseDownRef.current || !drawingModeRef.current) return

      isMouseDownRef.current = false
      map.dragPan.enable()

      if (pointsRef.current.length >= 3) {
        const closedPolygon: GeoJSON.Polygon = {
          type: 'Polygon',
          coordinates: [[...pointsRef.current, pointsRef.current[0]]],
        }

        const bounds = map.getBounds()
        const visibleMarkers = bounds
          ? markersRef.current.filter((marker) => {
              if (!marker.location) return false
              const { lng, lat } = marker.location
              return (
                lng >= bounds.getWest() &&
                lng <= bounds.getEast() &&
                lat >= bounds.getSouth() &&
                lat <= bounds.getNorth()
              )
            })
          : markersRef.current

        const tasksInPolygon = getTasksInPolygon(visibleMarkers, closedPolygon)
        const excluded = excludedIdsRef.current

        if (drawingModeRef.current === 'select') {
          const eligible = eligibleIdsRef.current
          setSelectedTaskIds((prev) => {
            const newSet = new Set(prev)
            for (const taskId of tasksInPolygon) {
              if (excluded.has(taskId)) continue
              if (!eligible.has(taskId)) continue
              if (newSet.size >= MAX_SELECTED_TASKS) break
              newSet.add(taskId)
            }
            return newSet
          })
        } else if (drawingModeRef.current === 'deselect') {
          setSelectedTaskIds((prev) => {
            const newSet = new Set(prev)
            for (const taskId of tasksInPolygon) {
              newSet.delete(taskId)
            }
            return newSet
          })
        }
      }

      // Reset drawing state
      pointsRef.current = []
      setLassoPolygon(null)
      setIsDrawing(false)
      setDrawingMode(null)
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      if (map.dragPan) map.dragPan.enable()
    }
  }, [mapRef, drawingMode, setDrawingMode, setIsDrawing, setLassoPolygon, setSelectedTaskIds])

  // Escape cancels drawing; the binding lives with the map's other shortcuts,
  // in useTaskMapShortcuts.
}
