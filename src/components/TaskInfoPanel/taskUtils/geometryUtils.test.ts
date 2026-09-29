import { describe, expect, it } from 'vitest'
import type { Task } from '@/types/Task'
import { countTaskFeatures, getTaskFeatureGroups } from './geometryUtils'

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
    expect(groups.map((group) => group.keys)).toEqual([['7:0'], ['7:1']])
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

  it('nests a GeometryCollection and keeps its properties on the collection', () => {
    const task = {
      id: 336355067,
      geometries: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'RoadNameSpellingConsistencyCheck', feature_count: '12' },
            geometry: {
              type: 'GeometryCollection',
              geometries: [
                {
                  type: 'MultiPoint',
                  coordinates: [
                    [1, 1],
                    [2, 2],
                  ],
                },
                {
                  type: 'MultiLineString',
                  coordinates: [
                    [
                      [1, 1],
                      [2, 2],
                    ],
                  ],
                },
              ],
            },
          },
        ],
      },
    } as unknown as Task

    const [collection] = getTaskFeatureGroups(task)

    expect(collection.geometryType).toBe('GeometryCollection')
    expect(collection.name).toBe('RoadNameSpellingConsistencyCheck')
    expect(Object.keys(collection.properties)).toHaveLength(2)

    expect(collection.children.map((c) => c.geometryType)).toEqual([
      'MultiPoint',
      'MultiLineString',
    ])
    expect(collection.children.every((c) => Object.keys(c.properties).length === 0)).toBe(true)

    expect(collection.children[0].children.map((c) => c.geometryType)).toEqual(['Point', 'Point'])
    expect(collection.children[1].children.map((c) => c.geometryType)).toEqual(['LineString'])

    expect(countTaskFeatures([collection])).toBe(3)
  })

  it('gives each drawn geometry the key the map decorates it with', () => {
    const task = {
      id: 7,
      geometries: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'GeometryCollection',
              geometries: [
                { type: 'Point', coordinates: [1, 1] },
                {
                  type: 'LineString',
                  coordinates: [
                    [1, 1],
                    [2, 2],
                  ],
                },
              ],
            },
          },
        ],
      },
    } as unknown as Task

    const [collection] = getTaskFeatureGroups(task)

    expect(collection.children.map((c) => c.keys)).toEqual([['7:0'], ['7:1']])
    expect(collection.keys).toEqual(['7:0', '7:1'])
  })

  it('gives a Multi* part its own key and the parent every part it holds', () => {
    const task = {
      id: 3,
      geometries: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'MultiPoint',
              coordinates: [
                [1, 1],
                [2, 2],
              ],
            },
          },
        ],
      },
    } as unknown as Task

    const [multi] = getTaskFeatureGroups(task)

    expect(multi.keys).toEqual(['3:0:0', '3:0:1'])
    expect(multi.children.map((c) => c.keys)).toEqual([['3:0:0'], ['3:0:1']])
    expect(multi.children.map((c) => c.nodeKey)).toEqual(['3.0.0', '3.0.1'])
    expect(multi.children[0].feature.geometry).toEqual({ type: 'Point', coordinates: [1, 1] })
  })

  it('resolves an OSM element ref from a feature that names one', () => {
    const task = {
      id: 5,
      geometries: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { '@id': 'way/676919290' },
            geometry: {
              type: 'LineString',
              coordinates: [
                [1, 1],
                [2, 2],
              ],
            },
          },
          {
            type: 'Feature',
            properties: { osmid: 12345 },
            geometry: { type: 'Point', coordinates: [1, 1] },
          },
        ],
      },
    } as unknown as Task

    expect(getTaskFeatureGroups(task).map((g) => g.osmRef)).toEqual(['way/676919290', 'node/12345'])
  })

  it('refuses an osm id too large to be a real element', () => {
    const task = {
      id: 6,
      geometries: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              osmid: '514198842000000676919290000002676919290000003676919290000004',
            },
            geometry: { type: 'Point', coordinates: [1, 1] },
          },
        ],
      },
    } as unknown as Task

    expect(getTaskFeatureGroups(task)[0].osmRef).toBeNull()
  })

  it('does not invent an OSM ref for a part with no properties of its own', () => {
    const task = {
      id: 8,
      geometries: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { osmid: 999 },
            geometry: {
              type: 'MultiLineString',
              coordinates: [
                [
                  [1, 1],
                  [2, 2],
                ],
                [
                  [3, 3],
                  [4, 4],
                ],
              ],
            },
          },
        ],
      },
    } as unknown as Task

    const [multi] = getTaskFeatureGroups(task)
    expect(multi.osmRef).toBe('way/999')
    expect(multi.children.map((c) => c.osmRef)).toEqual([null, null])
  })
})
