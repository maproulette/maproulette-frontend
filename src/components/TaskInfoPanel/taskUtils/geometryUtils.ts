import type { Feature } from 'geojson'
import { taskFeatureKey } from '@/lib/decorateTaskFeatures'
import type { Task } from '@/types/Task'

/** One feature of a task's GeoJSON, as the property list shows it. */
export interface TaskFeatureGroup {
  /** Matches the `featureKey` the map layers decorate this feature with. */
  key: string
  index: number
  /** Name from the feature's own properties, or null to fall back to a label. */
  name: string | null
  geometryType: string | null
  properties: Record<string, unknown>
  feature: Feature
}

/** Properties consulted, in order, for something to call a feature. */
const NAME_PROPERTIES = ['name', '@id', 'id', 'osmid', 'osm_id', 'ref']

const featureName = (properties: Record<string, unknown>): string | null => {
  for (const key of NAME_PROPERTIES) {
    const value = properties[key]
    if (typeof value === 'string' && value.trim() !== '') return value
    if (typeof value === 'number') return String(value)
  }
  return null
}

/**
 * Every feature of the task's GeoJSON, in the order the task carries them. A
 * task created from a FeatureCollection holds several at once, and each one is
 * listed on its own rather than collapsed into the first feature's properties.
 */
export const getTaskFeatureGroups = (task: Task): TaskFeatureGroup[] =>
  task.geometries.features.map((feature, index) => {
    const properties = (feature.properties ?? {}) as Record<string, unknown>
    return {
      key: taskFeatureKey(task.id, index),
      index,
      name: featureName(properties),
      geometryType: feature.geometry?.type ?? null,
      properties,
      feature,
    }
  })
