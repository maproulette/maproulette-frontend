import bbox from '@turf/bbox'
import type { Feature } from 'geojson'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import type { Bbox2D } from '@/types/Map'
import { useTaskContext } from './TaskContext'

/**
 * State shared between the task's property list and the map layers that draw
 * its geometry: which of the task's features is highlighted, which one (if
 * any) is being shown on its own, and whether direction indicators are drawn.
 *
 * A task built from a GeoJSON FeatureCollection is a single task made of many
 * features, so the panel needs to be able to point at one of them on the map.
 */
export interface TaskFeatureContextType {
  /** Feature shown on its own, hiding every other one. Null when all show. */
  focusedFeatureKey: string | null
  /** Feature drawn emphasized, e.g. while its properties are hovered. */
  highlightedFeatureKey: string | null
  showDirectionIndicators: boolean
  setShowDirectionIndicators: (show: boolean) => void
  focusFeature: (featureKey: string) => void
  clearFocusedFeature: () => void
  setHighlightedFeatureKey: (featureKey: string | null) => void
  /** Fit the map to one feature's own extent. */
  zoomToFeature: (feature: Feature) => void
}

const TaskFeatureContext = createContext<TaskFeatureContextType | undefined>(undefined)

/** Zoom cap for a feature too small to fill the viewport, e.g. a single point. */
const MAX_FEATURE_ZOOM = 19

export const TaskFeatureProvider = ({ children }: { children: ReactNode }) => {
  const { map: mapRef } = useTaskMapContext()
  const { task } = useTaskContext()
  const [focusedFeatureKey, setFocusedFeatureKey] = useState<string | null>(null)
  const [highlightedFeatureKey, setHighlightedFeatureKey] = useState<string | null>(null)
  const [showDirectionIndicators, setShowDirectionIndicators] = useState(true)

  // Feature keys are scoped to a task, so both selections are meaningless once
  // the mapper moves on to the next one.
  useEffect(() => {
    setFocusedFeatureKey(null)
    setHighlightedFeatureKey(null)
  }, [task.id])

  // Reason: stable references returned from context — consumers use these as event handler dependencies
  const focusFeature = useCallback((featureKey: string) => {
    setFocusedFeatureKey((current) => (current === featureKey ? null : featureKey))
  }, [])

  const clearFocusedFeature = useCallback(() => setFocusedFeatureKey(null), [])

  const zoomToFeature = useCallback(
    (feature: Feature) => {
      const map = mapRef.current?.getMap()
      if (!map) return

      const bounds = bbox(feature) as Bbox2D
      if (bounds.some((value) => !Number.isFinite(value))) return

      map.fitBounds(bounds, { padding: 120, maxZoom: MAX_FEATURE_ZOOM, duration: 600 })
    },
    [mapRef]
  )

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value: TaskFeatureContextType = useMemo(
    () => ({
      focusedFeatureKey,
      highlightedFeatureKey,
      showDirectionIndicators,
      setShowDirectionIndicators,
      focusFeature,
      clearFocusedFeature,
      setHighlightedFeatureKey,
      zoomToFeature,
    }),
    [
      focusedFeatureKey,
      highlightedFeatureKey,
      showDirectionIndicators,
      focusFeature,
      clearFocusedFeature,
      zoomToFeature,
    ]
  )

  return <TaskFeatureContext.Provider value={value}>{children}</TaskFeatureContext.Provider>
}

/**
 * The feature focus/zoom controls only exist alongside the task editor's map.
 * Panels that also render on browse pages (in a task drawer) use this and go
 * without those controls when there is no map to drive.
 */
export const useOptionalTaskFeatureContext = () => useContext(TaskFeatureContext)

export const useTaskFeatureContext = () => {
  const context = useContext(TaskFeatureContext)
  if (context === undefined) {
    throw new Error('useTaskFeatureContext must be used within a TaskFeatureProvider')
  }
  return context
}
