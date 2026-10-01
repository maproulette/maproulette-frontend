import { useMemo } from 'react'
import { api } from '@/api'
import { TaskGeometrySource } from '@/components/Map/TaskMarkers/TaskGeometrySource'
import { decorateTaskFeatures } from '@/lib/decorateTaskFeatures'
import { parseStyleRules } from '@/lib/taskFeatureStyle'

interface TaskGeometryLayerProps {
  selectedTaskId: number | null
}

/**
 * The selected task's geometry, for the maps that show one task at a time
 * (browse, explore, challenge management). Drawn through the same source the
 * task editor uses, so a feature keeps its size and color across maps.
 */
export const TaskGeometryLayer = ({ selectedTaskId }: TaskGeometryLayerProps) => {
  const { data: taskData } = api.task.getTask(selectedTaskId as number)
  const { data: challenge } = api.challenge.getChallenge(taskData?.parent ?? 0)

  const styleRules = useMemo(() => parseStyleRules(challenge?.taskStyles), [challenge?.taskStyles])

  const geometries = useMemo(() => {
    if (!selectedTaskId || !taskData) return null
    const decorated = decorateTaskFeatures(taskData, styleRules)
    return decorated.features.length > 0 ? decorated : null
  }, [selectedTaskId, taskData, styleRules])

  if (!geometries) {
    return null
  }

  return <TaskGeometrySource geometries={geometries} emphasizedTaskId={selectedTaskId} />
}
