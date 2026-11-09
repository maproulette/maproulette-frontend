import { useMemo } from 'react'
import { api } from '@/api'
import { TaskGeometrySource } from '@/components/Map/TaskMarkers/TaskGeometrySource'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskFeatureContext } from '@/components/Pages/TaskEditPage/contexts/TaskFeatureContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { decorateTaskFeatures } from '@/lib/decorateTaskFeatures'

/**
 * TaskGeometryLayer that always shows the primary task's geometries,
 * geometries for bundled tasks, and geometries for the selected marker.
 *
 * A task built from a GeoJSON FeatureCollection owns several features at once;
 * they are all drawn here as the one task they are, with direction indicators
 * on any line, and any single one of them can be picked out (highlighted) or
 * isolated from the task's property list.
 */
export const TaskGeometryLayer = () => {
  const { selectedMarker } = useTaskMapContext()
  const { activeBundle } = useTaskBundleContext()
  const { task } = useTaskContext()
  const { focusedFeature, highlightedFeature, showDirectionIndicators } = useTaskFeatureContext()
  const primaryTaskId = task.id

  // Always fetch the primary task's geometries
  const { data: primaryTask } = api.task.getTask(primaryTaskId)

  // Fetch bundled task geometries (excluding primary task)
  const bundledTaskIds = activeBundle?.taskIds.filter((id) => id !== primaryTaskId) ?? []
  const { data: bundledTasks } = api.task.getTasks(bundledTaskIds)

  // Fetch selected marker task data if there's a marker selected
  const selectedTaskId = selectedMarker?.id ?? null
  const { data: selectedTask } = api.task.getTask(selectedTaskId ?? 0)

  const geometries = useMemo(() => {
    const allFeatures: GeoJSON.Feature[] = []

    if (primaryTask) {
      allFeatures.push(...decorateTaskFeatures(primaryTask).features)
    }

    if (bundledTasks) {
      for (const task of bundledTasks) {
        allFeatures.push(...decorateTaskFeatures(task).features)
      }
    }

    if (
      selectedMarker &&
      selectedTask &&
      selectedTask.id !== primaryTaskId &&
      !activeBundle?.taskIds.includes(selectedTask.id)
    ) {
      allFeatures.push(...decorateTaskFeatures(selectedTask).features)
    }

    // Focusing one feature hides the rest of the task's geometry, so a single
    // feature of a crowded FeatureCollection can be looked at on its own.
    const focusedKeys = focusedFeature?.keys
    const features = focusedKeys
      ? allFeatures.filter((f) => focusedKeys.includes(f.properties?.partKey))
      : allFeatures

    if (features.length === 0) return null
    return { type: 'FeatureCollection' as const, features }
  }, [
    selectedMarker,
    primaryTask,
    primaryTaskId,
    selectedTask,
    bundledTasks,
    activeBundle,
    focusedFeature,
  ])

  if (!geometries) {
    return null
  }

  return (
    <TaskGeometrySource
      geometries={geometries}
      highlightedKeys={highlightedFeature?.keys ?? null}
      showDirections={showDirectionIndicators}
    />
  )
}
