import { useMemo } from 'react'
import {
  emphasizedPinStyle,
  type HighlightedMarker,
  type MarkerEmphasis,
} from '@/components/Map/TaskMarkers/markerStyle'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import type { TaskMarker } from '@/types/Task'

interface TaskState {
  isPrimary: boolean
  inBundle: boolean
  isSelected: boolean
  isActive: boolean
  isLassoSelected: boolean
  isHovered: boolean
}

export const taskEmphasis = ({
  isPrimary,
  inBundle,
  isSelected,
  isActive,
  isLassoSelected,
  isHovered,
}: TaskState): MarkerEmphasis | null => {
  const focused = isSelected || isActive
  if (isHovered) return 'hovered'
  if (isPrimary) return 'primary'
  if (inBundle) return focused ? 'bundled-selected' : 'bundled'
  if (isLassoSelected) return focused ? 'lasso-selected' : 'lasso'
  if (focused) return 'selected'
  return null
}

const DRAW_ORDER: Record<MarkerEmphasis, number> = {
  lasso: 0,
  selected: 1,
  'lasso-selected': 2,
  bundled: 3,
  'bundled-selected': 4,
  primary: 5,
  hovered: 6,
}

export const useTaskMapHighlights = (
  markersById: ReadonlyMap<number, TaskMarker>
): HighlightedMarker[] => {
  const { task } = useTaskContext()
  const { activeBundle } = useTaskBundleContext()
  const { selectedMarker, activeTaskId, selectedTaskIds, hoveredBundleTaskId } = useTaskMapContext()

  return useMemo(() => {
    const bundle = new Set(activeBundle?.taskIds ?? [])
    const candidates = new Set<number>([task.id, ...bundle, ...selectedTaskIds])
    if (selectedMarker) candidates.add(selectedMarker.id)
    if (activeTaskId != null) candidates.add(activeTaskId)
    if (hoveredBundleTaskId != null) candidates.add(hoveredBundleTaskId)

    const entries: Array<HighlightedMarker & { order: number }> = []
    for (const id of candidates) {
      const marker = markersById.get(id)
      if (!marker) continue
      const emphasis = taskEmphasis({
        isPrimary: id === task.id,
        inBundle: bundle.has(id),
        isSelected: id === selectedMarker?.id,
        isActive: id === activeTaskId,
        isLassoSelected: selectedTaskIds.has(id),
        isHovered: id === hoveredBundleTaskId,
      })
      if (emphasis) {
        entries.push({
          marker,
          style: emphasizedPinStyle(marker, emphasis),
          order: DRAW_ORDER[emphasis],
        })
      }
    }

    return entries.sort((a, b) => a.order - b.order).map(({ marker, style }) => ({ marker, style }))
  }, [
    markersById,
    task.id,
    activeBundle?.taskIds,
    selectedMarker,
    activeTaskId,
    selectedTaskIds,
    hoveredBundleTaskId,
  ])
}
