import type { TaskStyleRule } from '@/components/Map/FeatureStyleLegend/styleRuleToText'
import type { Task } from '@/types/Task'
import { resolveFeatureStyle } from './taskFeatureStyle'

/**
 * Stable identity for one feature of a task's FeatureCollection. The features
 * carry no ids of their own, so they're addressed by their position within the
 * task that owns them. Used to tie a row in the task's property list to the
 * geometry it draws on the map.
 */
export const taskFeatureKey = (taskId: number, featureIndex: number) => `${taskId}:${featureIndex}`

/**
 * Decorate each feature's properties with `taskId` so map layers can style
 * features by which task they belong to, with `featureKey`/`featureIndex` so a
 * single feature can be highlighted, isolated, or zoomed to, and with the
 * colors resolved from the data's own simplestyle properties (and the
 * challenge's style rules) under `mr`-prefixed names the paint expressions
 * read.
 */
export const decorateTaskFeatures = (
  task: Task,
  styleRules: TaskStyleRule[] = []
): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: task.geometries.features.map((f, index) => {
    const style = resolveFeatureStyle(f, styleRules)
    // Only styles the data actually specified are attached, so `coalesce` in
    // the paint expressions falls through to the default for the rest.
    const styleProperties = Object.fromEntries(
      Object.entries({
        mrStroke: style.stroke,
        mrStrokeWidth: style.strokeWidth,
        mrStrokeOpacity: style.strokeOpacity,
        mrFill: style.fill ?? style.stroke,
        mrFillOpacity: style.fillOpacity,
        mrMarkerColor: style.markerColor ?? style.stroke,
      }).filter(([, value]) => value !== undefined)
    )
    return {
      ...f,
      properties: {
        ...f.properties,
        taskId: task.id,
        featureIndex: index,
        featureKey: taskFeatureKey(task.id, index),
        ...styleProperties,
      },
    }
  }),
})
