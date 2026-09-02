import type { Task } from '@/types/Task'

/** Map state the workspace properties describe, when a map is on screen. */
export interface WorkspaceViewport {
  /** [west, south, east, north] */
  bounds?: [number, number, number, number] | null
  zoom?: number | null
}

/**
 * The OSM type and id of a task's feature, where they can be worked out. Task
 * geometries carry them either as an `@id` of the form `way/1234`, or as
 * separate `osmType`/`osmid` style properties.
 */
const osmIdentity = (task: Task): { osmType?: string; osmId?: string } => {
  for (const feature of task.geometries?.features ?? []) {
    const properties = (feature.properties ?? {}) as Record<string, unknown>

    const combined = properties['@id'] ?? properties.osmIdentifier ?? properties.id
    if (typeof combined === 'string') {
      const match = /^(node|way|relation)\/(\d+)$/.exec(combined)
      if (match) return { osmType: match[1], osmId: match[2] }
    }

    const type = properties.osmType ?? properties['@type']
    const id = properties.osmid ?? properties.osmId ?? properties['@id']
    if (type != null && id != null) {
      return { osmType: String(type), osmId: String(id) }
    }
  }
  return {}
}

/**
 * The `#`-prefixed "workspace" properties a challenge's instructions can
 * reference. They describe the workspace rather than the task's own feature
 * properties, and the hash keeps the two namespaces apart.
 *
 * Only properties that can actually be resolved are returned, so an
 * unresolvable tag is left visible in the text rather than being replaced with
 * "undefined".
 */
export const workspaceProperties = (
  task: Task,
  viewport?: WorkspaceViewport | null
): Record<string, string> => {
  const properties: Record<string, string> = { '#mrTaskId': String(task.id) }

  const { osmType, osmId } = osmIdentity(task)
  if (osmType) properties['#osmType'] = osmType
  if (osmId) properties['#osmId'] = osmId

  if (typeof viewport?.zoom === 'number') {
    properties['#mapZoom'] = String(Math.floor(viewport.zoom))
  }

  const bounds = viewport?.bounds
  if (bounds && bounds.length === 4 && bounds.every((n) => Number.isFinite(n))) {
    const [west, south, east, north] = bounds
    properties['#mapBBox'] = `${west},${south},${east},${north}`
    properties['#mapWest'] = String(west)
    properties['#mapSouth'] = String(south)
    properties['#mapEast'] = String(east)
    properties['#mapNorth'] = String(north)
    properties['#mapLat'] = String((south + north) / 2)
    properties['#mapLon'] = String((west + east) / 2)
  }

  return properties
}
