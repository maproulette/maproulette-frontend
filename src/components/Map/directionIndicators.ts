import type { Feature, FeatureCollection, Point, Position } from 'geojson'

/**
 * Direction indicators for task geometry: arrows drawn along every line so the
 * direction the line was digitized is readable at a glance, plus a marker at
 * each end of it. MapRoulette 3 conveyed this with a one-shot draw animation,
 * which said nothing once it had finished playing and never ran at all for
 * bundled tasks; static indicators are always on, for every task on the map.
 */

/** Map image names registered by `createDirectionIcons`. */
export const DIRECTION_ICONS = {
  arrow: 'direction-arrow',
  start: 'direction-start',
  end: 'direction-end',
} as const

export type EndpointRole = 'start' | 'end'

export interface DirectionEndpointProperties {
  role: EndpointRole
  /** Identity of the feature this endpoint belongs to, see `taskFeatureKey`. */
  featureKey: string | null
  taskId: number | null
  /** Index of the line within a MultiLineString, always 0 for a LineString. */
  lineIndex: number
}

export type DirectionEndpoints = FeatureCollection<Point, DirectionEndpointProperties>

const LINE_TYPES = ['LineString', 'MultiLineString']

/** The individual coordinate arrays of a feature, one per drawn line. */
const linesOf = (feature: Feature): Position[][] => {
  if (feature.geometry.type === 'LineString') return [feature.geometry.coordinates]
  if (feature.geometry.type === 'MultiLineString') return feature.geometry.coordinates
  return []
}

const samePosition = (a: Position, b: Position) => a[0] === b[0] && a[1] === b[1]

/** Whether any of the given features is a line, and so has a direction to show. */
export const hasDirectionalGeometry = (features: Feature[]): boolean =>
  features.some((f) => LINE_TYPES.includes(f.geometry.type))

/**
 * Build the start/end markers for every line in the given features. Lines with
 * fewer than two positions have no direction, and closed rings would stack
 * their two markers on the same point, so both are skipped — the arrows along
 * the line still carry the direction in the closed case.
 */
export const buildDirectionEndpoints = (features: Feature[]): DirectionEndpoints => {
  const endpoints: Feature<Point, DirectionEndpointProperties>[] = []

  for (const feature of features) {
    const properties = feature.properties ?? {}
    const featureKey = typeof properties.featureKey === 'string' ? properties.featureKey : null
    const taskId = typeof properties.taskId === 'number' ? properties.taskId : null

    linesOf(feature).forEach((line, lineIndex) => {
      const first = line[0]
      const last = line[line.length - 1]
      if (line.length < 2 || samePosition(first, last)) return

      const endpoint = (role: EndpointRole, position: Position) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [position[0], position[1]] },
        properties: { role, featureKey, taskId, lineIndex },
      })

      endpoints.push(endpoint('start', first), endpoint('end', last))
    })
  }

  return { type: 'FeatureCollection', features: endpoints }
}
