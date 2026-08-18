import type { Task } from '@/types/Task'

/** Extract properties from only the first geometry feature (other features' properties are ignored). */
export const parseFirstFeatureProperties = (task: Task): Record<string, unknown> | null => {
  return task.geometries.features[0]?.properties ?? null
}
