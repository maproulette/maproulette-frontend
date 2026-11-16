import type { Task } from '@/types/Task'
export const getOsmServerUrl = () => {
  return window.env.VITE_OSM_SERVER || 'https://www.openstreetmap.org'
}

export interface OsmFeature {
  type: 'node' | 'way' | 'relation'
  id: number
}

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
    case 'GeometryCollection':
      return 'relation'
    default:
      return null
  }
}

const OSM_ID_FIELDS = ['@id', 'osmid', 'osmIdentifier', 'id', 'osm_id', '@osmId']
const OSM_TYPE_FIELDS = ['type', '@type', '@osm_type', 'osm_type']
const OSM_ID_PATTERN = /^(node|way|relation|n|w|r)?\/?(\d+)$/i
const OSM_TYPE_NAMES: Record<string, OsmFeature['type']> = {
  node: 'node',
  n: 'node',
  way: 'way',
  w: 'way',
  relation: 'relation',
  r: 'relation',
}

const findOsmId = (source: Record<string, unknown>): RegExpExecArray | null => {
  for (const field of OSM_ID_FIELDS) {
    const value = source[field]
    if (!value) continue
    const match = OSM_ID_PATTERN.exec(String(value))
    if (match) return match
  }
  return null
}

/**
 * Try to extract an OSM feature (type + id) from a GeoJSON feature, looking at
 * the feature's own id fields first and then its properties. Ids may be bare
 * numbers or carry their type, as `node/123`, `way123` or `w123`; otherwise the
 * type comes from a type property, and failing that from the geometry.
 */
export const parseOsmFeatureFromProperties = (
  properties: Record<string, unknown>,
  geomType?: string,
  featureFields: Record<string, unknown> = {}
): OsmFeature | null => {
  const match = findOsmId(featureFields) ?? findOsmId(properties)
  if (!match) return null

  const id = Number(match[2])
  if (!Number.isSafeInteger(id) || id <= 0) return null

  const typeFromId = match[1] ? OSM_TYPE_NAMES[match[1].toLowerCase()] : undefined
  const typeProperty = OSM_TYPE_FIELDS.map((field) => properties[field]).find(
    (value) => typeof value === 'string' && OSM_TYPE_NAMES[value.toLowerCase()]
  )
  const type =
    typeFromId ??
    (typeof typeProperty === 'string' ? OSM_TYPE_NAMES[typeProperty.toLowerCase()] : undefined) ??
    inferOsmTypeFromGeometry(geomType)

  return type ? { type, id } : null
}

export const parseOsmFeatureFromTask = (task: Task): OsmFeature | null => {
  const all = parseOsmFeaturesFromTask(task)
  return all.length > 0 ? all[0] : null
}

export const parseOsmFeaturesFromTask = (task: Task): OsmFeature[] => {
  const out: OsmFeature[] = []
  for (const feature of task.geometries.features) {
    if (!feature.properties) continue
    const parsed = parseOsmFeatureFromProperties(
      feature.properties,
      feature.geometry?.type,
      feature as unknown as Record<string, unknown>
    )
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
