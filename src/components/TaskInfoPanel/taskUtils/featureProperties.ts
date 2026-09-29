type Entry = Record<string, unknown>

type Kind = 'point' | 'line' | 'polygon'

const GEOMETRY_KINDS: Record<string, Kind> = {
  Point: 'point',
  MultiPoint: 'point',
  LineString: 'line',
  MultiLineString: 'line',
  Polygon: 'polygon',
  MultiPolygon: 'polygon',
}

const ITEM_TYPE_KINDS: Record<string, Kind> = {
  node: 'point',
  point: 'point',
  edge: 'line',
  line: 'line',
  way: 'line',
  area: 'polygon',
  relation: 'polygon',
}

const entryKind = (entry: Entry): Kind | null => {
  if ('synthetic_highlight_point' in entry) return 'point'
  const itemType = entry.itemType
  if (typeof itemType === 'string') return ITEM_TYPE_KINDS[itemType.toLowerCase()] ?? null
  return null
}

const parseEntries = (value: unknown): Entry[] | null => {
  let parsed = value
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return null
    }
  }
  if (!Array.isArray(parsed)) return null
  return parsed.every((entry) => entry && typeof entry === 'object') ? (parsed as Entry[]) : null
}

/**
 * Per-geometry properties a task generator packed into one `feature_properties`
 * array on the feature above them, matched to the geometries they describe.
 *
 * The array is not in geometry order: AtlasChecks lists every Edge and then
 * every synthetic highlight point, while the GeometryCollection holds the
 * points first. Each entry does say what kind of thing it describes, though, so
 * entries and geometries are bucketed by kind and matched by position within a
 * bucket. Verified against OpenStreetMap on 2026-09-29 for tasks 336355064 and
 * 336355067: all twelve line geometries fall inside exactly the way their
 * positionally matched entry names.
 *
 * Returns null unless every bucket lines up exactly, so a generator that orders
 * things differently shows nothing rather than the wrong element's tags.
 */
export const distributeFeatureProperties = (
  containerProperties: Record<string, unknown>,
  geometryTypes: (string | null)[]
): Entry[] | null => {
  const entries = parseEntries(containerProperties.feature_properties)
  if (!entries || entries.length !== geometryTypes.length) return null

  const byKind = new Map<Kind, Entry[]>()
  for (const entry of entries) {
    const kind = entryKind(entry)
    if (!kind) return null
    const bucket = byKind.get(kind)
    if (bucket) bucket.push(entry)
    else byKind.set(kind, [entry])
  }

  const taken = new Map<Kind, number>()
  const out: Entry[] = []
  for (const geometryType of geometryTypes) {
    const kind = geometryType ? GEOMETRY_KINDS[geometryType] : undefined
    if (!kind) return null
    const bucket = byKind.get(kind)
    const index = taken.get(kind) ?? 0
    if (!bucket || index >= bucket.length) return null
    taken.set(kind, index + 1)
    out.push(bucket[index])
  }

  return out
}
