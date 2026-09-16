import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import type { TaskMarker } from '@/types/Task'
import { useTaskContext } from './TaskContext'

export const MAX_SELECTED_TASKS = 50

export type LassoMode = 'select' | 'deselect' | null

export interface TaskMapContextType {
  map: React.RefObject<MapRef | null>
  mapLoaded: boolean
  setMapLoaded: (loaded: boolean) => void
  selectedMarker: TaskMarker | null
  setSelectedMarker: (marker: TaskMarker | null) => void
  markersHidden: boolean
  setMarkersHidden: (hidden: boolean) => void
  hoveredBundleTaskId: number | null
  setHoveredBundleTaskId: (taskId: number | null) => void
  activeTaskId: number | null
  setActiveTaskId: (taskId: number | null) => void
  emptyClickCount: number
  triggerEmptyClick: () => void

  // Lasso selection state
  drawingMode: LassoMode
  setDrawingMode: (mode: LassoMode) => void
  isDrawing: boolean
  setIsDrawing: (drawing: boolean) => void
  lassoPolygon: [number, number][] | null
  setLassoPolygon: (polygon: [number, number][] | null) => void
  selectedTaskIds: Set<number>
  setSelectedTaskIds: React.Dispatch<React.SetStateAction<Set<number>>>
  isAtSelectionLimit: boolean

  // Lasso actions
  startDrawing: (mode: 'select') => void
  cancelDrawing: () => void
  clearSelection: () => void
}

const TaskMapContext = createContext<TaskMapContextType | undefined>(undefined)

export const TaskMapProvider = ({ children }: { children: ReactNode }) => {
  const { task } = useTaskContext()
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [selectedMarker, setSelectedMarker] = useState<TaskMarker | null>(null)
  const [markersHidden, setMarkersHidden] = useState(false)
  const [hoveredBundleTaskId, setHoveredBundleTaskId] = useState<number | null>(null)
  const [activeTaskId, setActiveTaskId] = useState<number | null>(null)
  const [emptyClickCount, setEmptyClickCount] = useState(0)

  // Lasso state
  const [drawingMode, setDrawingMode] = useState<LassoMode>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lassoPolygon, setLassoPolygon] = useState<[number, number][] | null>(null)
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set())

  const currentModeRef = useRef<LassoMode>(null)

  // The map itself deliberately outlives a move to the next task, so everything
  // pinned to the task the mapper just left - what they had selected, hidden or
  // half-lassoed on it - is cleared here instead of by a remount. Only on an
  // actual move: on the first task this would wipe whatever the mount-time
  // effects below it have already set.
  const clearedForTaskIdRef = useRef(task.id)
  useEffect(() => {
    if (clearedForTaskIdRef.current === task.id) return
    clearedForTaskIdRef.current = task.id

    setSelectedMarker(null)
    setMarkersHidden(false)
    setHoveredBundleTaskId(null)
    setEmptyClickCount(0)
    currentModeRef.current = null
    setDrawingMode(null)
    setIsDrawing(false)
    setLassoPolygon(null)
    setSelectedTaskIds(new Set())
  }, [task.id])

  const triggerEmptyClick = () => {
    setEmptyClickCount((prev) => prev + 1)
  }

  // Reason: stable references returned from context — consumers use these as event handler dependencies
  const startDrawing = useCallback((mode: 'select') => {
    currentModeRef.current = mode
    setDrawingMode(mode)
  }, [])

  const cancelDrawing = useCallback(() => {
    if (mapRef.current) {
      const map = mapRef.current.getMap()
      if (map?.dragPan) {
        map.dragPan.enable()
      }
    }
    currentModeRef.current = null
    setDrawingMode(null)
    setLassoPolygon(null)
    setIsDrawing(false)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTaskIds(new Set())
  }, [])

  const isAtSelectionLimit = selectedTaskIds.size >= MAX_SELECTED_TASKS

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value: TaskMapContextType = useMemo(
    () => ({
      map: mapRef,
      mapLoaded,
      setMapLoaded,
      selectedMarker,
      setSelectedMarker,
      markersHidden,
      setMarkersHidden,
      hoveredBundleTaskId,
      setHoveredBundleTaskId,
      activeTaskId,
      setActiveTaskId,
      emptyClickCount,
      triggerEmptyClick,
      drawingMode,
      setDrawingMode,
      isDrawing,
      setIsDrawing,
      lassoPolygon,
      setLassoPolygon,
      selectedTaskIds,
      setSelectedTaskIds,
      isAtSelectionLimit,
      startDrawing,
      cancelDrawing,
      clearSelection,
    }),
    [
      mapLoaded,
      selectedMarker,
      markersHidden,
      hoveredBundleTaskId,
      activeTaskId,
      emptyClickCount,
      drawingMode,
      isDrawing,
      lassoPolygon,
      selectedTaskIds,
      isAtSelectionLimit,
      startDrawing,
      cancelDrawing,
      clearSelection,
    ]
  )

  return <TaskMapContext.Provider value={value}>{children}</TaskMapContext.Provider>
}

/** Null outside the task editor, e.g. in a task drawer on a browse page. */
export const useOptionalTaskMapContext = () => useContext(TaskMapContext)

export const useTaskMapContext = () => {
  const context = useContext(TaskMapContext)
  if (context === undefined) {
    throw new Error('useTaskMapContext must be used within a TaskMapProvider')
  }
  return context
}
