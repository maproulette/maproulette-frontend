import { z } from 'zod'
import { localStored } from '@/lib/storage'
import type { TaskMarker } from '@/types/Task'

/** Subsets of a challenge's tasks to show on the map */
export const TASK_FILTERS = ['available', 'completed', 'all'] as const

export type TaskFilter = (typeof TASK_FILTERS)[number]

export const DEFAULT_TASK_FILTER: TaskFilter = 'available'

const FILTER_STATUSES: Record<Exclude<TaskFilter, 'all'>, ReadonlySet<number>> = {
  available: new Set([0, 3, 6]),
  completed: new Set([1, 2, 5, 7]),
}

export const filterMarkers = (markers: TaskMarker[], filter: TaskFilter) => {
  if (filter === 'all') return markers
  const statuses = FILTER_STATUSES[filter]
  return markers.filter((marker) => statuses.has(marker.status ?? 0))
}

export const storedTaskFilter = localStored(
  'challengeMap.tasksShown',
  z.enum(TASK_FILTERS),
  DEFAULT_TASK_FILTER
)
