import type { Feature } from 'geojson'
import { splitMultiGeometry, taskFeatureKey, taskFeaturePartKey } from '@/lib/decorateTaskFeatures'
import type { Task } from '@/types/Task'
import { distributeFeatureProperties } from './featureProperties'
import { osmElementRef, parseOsmFeatureFromProperties } from './osmUtils'

/** One feature of a task's GeoJSON, as the property list shows it. */
export interface TaskFeatureGroup {
  /**
   * Every `partKey` the map draws for this node and everything beneath it.
   * Highlighting or isolating a node acts on all of them, so a Multi* part
   * carries one key while the collection above it carries all of its members'.
   */
  keys: string[]
  /** Identity within the tree, unique across every task the panel shows at once. */
  nodeKey: string
  index: number
  /** Name from the feature's own properties, or null to fall back to a label. */
  name: string | null
  geometryType: string | null
  properties: Record<string, unknown>
  /** `way/123` where this node's own properties name an OSM element, so its live tags can be fetched. */
  osmRef: string | null
  feature: Feature
  children: TaskFeatureGroup[]
}

const leavesOf = (groups: TaskFeatureGroup[]): TaskFeatureGroup[] =>
  groups.flatMap((group) => (group.children.length > 0 ? leavesOf(group.children) : [group]))

const applyPackedProperties = (
  containerProperties: Record<string, unknown>,
  children: TaskFeatureGroup[]
) => {
  const leaves = leavesOf(children)
  const distributed = distributeFeatureProperties(
    containerProperties,
    leaves.map((leaf) => leaf.geometryType)
  )
  if (!distributed) return

  leaves.forEach((leaf, index) => {
    const properties = distributed[index]
    leaf.properties = properties
    leaf.name = featureName(properties)
    leaf.osmRef = osmRefFor(properties, leaf.geometryType ?? undefined)
  })
}

const osmRefFor = (properties: Record<string, unknown>, geometryType?: string): string | null => {
  const parsed = parseOsmFeatureFromProperties(properties, geometryType)
  return parsed ? osmElementRef(parsed) : null
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
 * Every feature of the task's GeoJSON as a tree: the features the task carries,
 * the geometries a GeometryCollection holds, and the parts a Multi* geometry is
 * made of. A GeometryCollection's properties belong to the collection, so they
 * are shown once on it rather than repeated on each geometry beneath it.
 *
 * `keys` are the `partKey`s the map draws for a node and everything under it,
 * so acting on a node acts on exactly the geometry it stands for: one line of a
 * MultiLineString for a part, every member for the collection above it.
 */
export const getTaskFeatureGroups = (task: Task): TaskFeatureGroup[] => {
  let drawn = 0

  const build = (feature: Feature, index: number, path: string): TaskFeatureGroup => {
    const properties = (feature.properties ?? {}) as Record<string, unknown>
    const geometry = feature.geometry

    if (geometry?.type === 'GeometryCollection') {
      const children = geometry.geometries.map((child, childIndex) =>
        build({ ...feature, properties: {}, geometry: child }, childIndex, `${path}.${childIndex}`)
      )
      applyPackedProperties(properties, children)
      return {
        keys: children.flatMap((child) => child.keys),
        nodeKey: path,
        index,
        name: featureName(properties),
        geometryType: geometry.type,
        properties,
        osmRef: osmRefFor(properties, geometry.type),
        feature,
        children,
      }
    }

    const featureKey = taskFeatureKey(task.id, drawn)
    drawn += 1
    const parts = geometry ? splitMultiGeometry(geometry) : []

    const children = parts.map((part, partIndex) => ({
      keys: [taskFeaturePartKey(featureKey, partIndex)],
      nodeKey: `${path}.${partIndex}`,
      index: partIndex,
      name: null,
      geometryType: part.type,
      properties: {},
      osmRef: null,
      feature: { ...feature, properties: {}, geometry: part } as Feature,
      children: [],
    }))

    return {
      keys: children.length > 0 ? children.flatMap((child) => child.keys) : [featureKey],
      nodeKey: path,
      index,
      name: featureName(properties),
      geometryType: geometry?.type ?? null,
      properties,
      osmRef: osmRefFor(properties, geometry?.type),
      feature,
      children,
    }
  }

  return (task.geometries?.features ?? []).map((feature, index) =>
    build(feature as Feature, index, `${task.id}.${index}`)
  )
}

/** Deepest nodes of the tree — what the task's own feature count refers to. */
export const countTaskFeatures = (groups: TaskFeatureGroup[]): number => leavesOf(groups).length
