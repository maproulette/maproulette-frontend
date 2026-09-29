import type { Task } from '@/types/Task'
export const getOsmServerUrl = () => {
  return window.env.VITE_OSM_SERVER || 'https://www.openstreetmap.org'
}

export interface OsmFeature {
  type: 'node' | 'way' | 'relation'
  id: number
}

/**
 * Infer OSM element type from a GeoJSON geometry type.
 * Point → node, LineString → way, Polygon → way (or relation for multipolygon,
 * but we can't distinguish here so default to way).
 */
const inferOsmTypeFromGeometry = (
  geomType: string | undefined
): 'node' | 'way' | 'relation' | null => {
  switch (geomType) {
    case 'Point':
      return 'node'
    case 'LineString':
    case 'MultiLineString':
    case 'Polygon':
      return 'way'
    case 'MultiPolygon':
      return 'relation'
    default:
      return null
  }
}

/**
 * Try to extract an OSM feature (type + id) from a GeoJSON feature's properties.
 * Handles multiple property naming conventions used by different challenge creators.
 */
export const parseOsmFeatureFromProperties = (
  properties: Record<string, unknown>,
  geomType?: string
): OsmFeature | null => {
  // 1. Look for typed string IDs like "node/123", "way/456"
  const typedId = properties['@id'] || properties.id || properties.osm_id
  if (typedId && typeof typedId === 'string') {
    const match = typedId.match(/^(node|way|relation)\/(\d+)$/)
    if (match) {
      return { type: match[1] as 'node' | 'way' | 'relation', id: parseInt(match[2], 10) }
    }
  }

  // 2. Look for a numeric ID (osmid, osm_id, @osmId) with an optional explicit type
  const numericId =
    properties.osmid || properties.osm_id || properties['@osmId'] || properties.osmIdentifier
  if (numericId != null) {
    const numId = Number(numericId)
    if (Number.isSafeInteger(numId) && numId > 0) {
      // Use explicit type if available, otherwise infer from geometry
      const osmType = properties['@type'] || properties.osm_type
      if (osmType) {
        const type = String(osmType).toLowerCase()
        if (type === 'node' || type === 'way' || type === 'relation') {
          return { type, id: numId }
        }
      }
      const inferredType = inferOsmTypeFromGeometry(geomType)
      if (inferredType) {
        return { type: inferredType, id: numId }
      }
    }
  }

  return null
}

export const parseOsmFeatureFromTask = (task: Task): OsmFeature | null => {
  const all = parseOsmFeaturesFromTask(task)
  return all.length > 0 ? all[0] : null
}

export const parseOsmFeaturesFromTask = (task: Task): OsmFeature[] => {
  const out: OsmFeature[] = []
  for (const feature of task.geometries.features) {
    if (!feature.properties) continue
    const parsed = parseOsmFeatureFromProperties(feature.properties, feature.geometry?.type)
    if (parsed) out.push(parsed)
  }
  return out
}

const prefixFor = (t: OsmFeature['type'], abbreviated: boolean) => (abbreviated ? t.charAt(0) : t)

/**
 * Format OSM entity references for an editor URL.
 *
 * - `abbreviated: true`  → `n123,w456,r789`  (iD, Rapid)
 * - `abbreviated: false` → `node123,way456,relation789`  (JOSM)
 *
 * Accepts a single task or an array (for bundles). Returns "" if no features
 * with usable OSM ids are found.
 */
export const formatOsmEntities = (
  tasks: Task | Task[],
  { abbreviated = false }: { abbreviated?: boolean } = {}
): string => {
  const list = Array.isArray(tasks) ? tasks : [tasks]
  const parts: string[] = []
  for (const t of list) {
    for (const f of parseOsmFeaturesFromTask(t)) {
      parts.push(`${prefixFor(f.type, abbreviated)}${f.id}`)
    }
  }
  return parts.join(',')
}

export const osmElementRef = (feature: OsmFeature): string => `${feature.type}/${feature.id}`
