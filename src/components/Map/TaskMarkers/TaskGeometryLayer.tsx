import { useMemo } from 'react'
import { api } from '@/api'
import { TaskGeometrySource } from '@/components/Map/TaskMarkers/TaskGeometrySource'
import { decorateTaskFeatures } from '@/lib/decorateTaskFeatures'

interface TaskGeometryLayerProps {
  selectedTaskId: number | null
  showDirections?: boolean
}

/**
 * The selected task's geometry, for the maps that show one task at a time
 * (browse, explore, challenge management). Drawn through the same source the
 * task editor uses, so a feature keeps its size and color across maps.
 */
export const TaskGeometryLayer = ({
  selectedTaskId,
  showDirections = true,
}: TaskGeometryLayerProps) => {
  const { data: taskData } = api.task.getTask(selectedTaskId as number)

  const geometries = useMemo(() => {
    if (!selectedTaskId || !taskData) return null
    const decorated = decorateTaskFeatures(taskData)
    return decorated.features.length > 0 ? decorated : null
  }, [selectedTaskId, taskData])

  if (!geometries) {
    return null
  }

  return <TaskGeometrySource geometries={geometries} showDirections={showDirections} />
}
