import { describe, expect, it } from 'vitest'
import type { Task } from '@/types/Task'
import { getTaskFeatureGroups } from './geometryUtils'

const taskWith = (features: GeoJSON.Feature[]): Task =>
  ({
    id: 7,
    geometries: { type: 'FeatureCollection', features },
  }) as unknown as Task

const lineFeature = (properties: Record<string, unknown>): GeoJSON.Feature => ({
  type: 'Feature',
  properties,
  geometry: {
    type: 'LineString',
    coordinates: [
      [0, 0],
      [1, 1],
    ],
  },
})

describe('getTaskFeatureGroups', () => {
  it('lists every feature of a FeatureCollection task, not just the first', () => {
    const groups = getTaskFeatureGroups(
      taskWith([lineFeature({ name: 'North leg' }), lineFeature({ highway: 'service' })])
    )

    expect(groups).toHaveLength(2)
    expect(groups.map((group) => group.key)).toEqual(['7:0', '7:1'])
    expect(groups.map((group) => group.index)).toEqual([0, 1])
    expect(groups[1].properties).toEqual({ highway: 'service' })
  })

  it('names a feature from its properties, preferring name over ids', () => {
    const [named, byId, unnamed] = getTaskFeatureGroups(
      taskWith([
        lineFeature({ name: 'Main St', '@id': 'way/1' }),
        lineFeature({ '@id': 'way/2' }),
        lineFeature({ highway: 'service' }),
      ])
    )

    expect(named.name).toBe('Main St')
    expect(byId.name).toBe('way/2')
    expect(unnamed.name).toBeNull()
  })

  it('reports the geometry type and tolerates absent properties', () => {
    const [group] = getTaskFeatureGroups(
      taskWith([
        { type: 'Feature', properties: null, geometry: { type: 'Point', coordinates: [1, 2] } },
      ])
    )

    expect(group.geometryType).toBe('Point')
    expect(group.properties).toEqual({})
    expect(group.name).toBeNull()
  })
})
