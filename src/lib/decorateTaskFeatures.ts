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
 * Stable identity for one part of a Multi* geometry. A MultiLineString is a
 * single GeoJSON feature but several lines on screen, and the property list
 * lets each of them be picked out on its own, so the parts are drawn as
 * separate map features under keys derived from the feature that owns them.
 */
export const taskFeaturePartKey = (featureKey: string, partIndex: number) =>
  `${featureKey}:${partIndex}`

const MULTI_PARTS: Partial<Record<GeoJSON.Geometry['type'], GeoJSON.Geometry['type']>> = {
  MultiPoint: 'Point',
  MultiLineString: 'LineString',
  MultiPolygon: 'Polygon',
}

/** The single-part geometries a Multi* is made of, or none for anything else. */
export const splitMultiGeometry = (geometry: GeoJSON.Geometry): GeoJSON.Geometry[] => {
  const part = MULTI_PARTS[geometry.type]
  if (!part || !('coordinates' in geometry)) return []
  return (geometry.coordinates as unknown[]).map(
    (coordinates) => ({ type: part, coordinates }) as GeoJSON.Geometry
  )
}

const withRenderableId = (feature: GeoJSON.Feature): GeoJSON.Feature => {
  if (feature.id === undefined || feature.id === null) return feature
  const id = typeof feature.id === 'string' ? Number.parseInt(feature.id, 10) : feature.id
  if (Number.isSafeInteger(id)) return feature
  const { id: _unrenderable, ...rest } = feature
  return rest as GeoJSON.Feature
}

export const taskFeatures = (task: Task): GeoJSON.Feature[] => {
  const flatten = (feature: GeoJSON.Feature): GeoJSON.Feature[] => {
    if (feature.geometry?.type !== 'GeometryCollection') return [feature]
    return feature.geometry.geometries.flatMap((geometry) =>
      flatten({ ...feature, geometry } as GeoJSON.Feature)
    )
  }

  return (task.geometries?.features ?? []).flatMap(flatten).map(withRenderableId)
}

/**
 * Decorate each feature's properties with `taskId` so map layers can style
 * features by which task they belong to, with `featureKey`/`featureIndex` so a
 * single feature can be highlighted, isolated, or zoomed to, and with the
 * colors resolved from the data's own simplestyle properties (and the
 * challenge's style rules) under `mr`-prefixed names the paint expressions
 * read.
 *
 * A Multi* geometry becomes one drawn feature per part, each under its own
 * `partKey`. Rendering is unchanged -- six lines drawn as six features look
 * exactly like six lines drawn as one MultiLineString -- but it gives the
 * property list something to point at when a mapper asks for one line of a
 * MultiLineString rather than all of them. `partKey` is the only identity the
 * map layers select on; `featureKey` stays the owning feature's, shared by all
 * of its parts.
 */
export const decorateTaskFeatures = (
  task: Task,
  styleRules: TaskStyleRule[] = []
): GeoJSON.FeatureCollection => ({
  type: 'FeatureCollection',
  features: taskFeatures(task).flatMap((f, index) => {
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
    const featureKey = taskFeatureKey(task.id, index)
    const properties = {
      ...f.properties,
      taskId: task.id,
      featureIndex: index,
      featureKey,
      ...styleProperties,
    }

    const parts = f.geometry ? splitMultiGeometry(f.geometry) : []
    if (parts.length === 0) {
      return [{ ...f, properties: { ...properties, partKey: featureKey } }]
    }

    return parts.map((geometry, partIndex) => ({
      ...f,
      geometry,
      properties: { ...properties, partKey: taskFeaturePartKey(featureKey, partIndex) },
    }))
  }),
})
