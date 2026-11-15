import type { TaskMarker } from '@/types/Task'

/** Subsets of a challenge's tasks to show on the map (unset means show all tasks) */
export const TASK_FILTERS = ['available', 'completed'] as const

export type TaskFilter = (typeof TASK_FILTERS)[number]

const FILTER_STATUSES: Record<TaskFilter, ReadonlySet<number>> = {
  available: new Set([0, 3, 6]),
  completed: new Set([1, 2, 5, 7]),
}

export const filterMarkers = (markers: TaskMarker[], filter: TaskFilter | undefined) => {
  if (!filter) return markers
  const statuses = FILTER_STATUSES[filter]
  return markers.filter((marker) => statuses.has(marker.status ?? 0))
}
