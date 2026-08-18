import { afterEach, describe, expect, it } from 'vitest'
import type { Task } from '@/types/Task'
import {
  formatOsmEntities,
  getOsmServerUrl,
  parseOsmFeatureFromTask,
  parseOsmFeaturesFromTask,
} from './osmUtils.ts'

describe('getOsmServerUrl', () => {
  const mutableEnv = window.env as unknown as { VITE_OSM_SERVER: string | undefined }
  const originalOsmServer = mutableEnv.VITE_OSM_SERVER

  afterEach(() => {
    mutableEnv.VITE_OSM_SERVER = originalOsmServer
  })

  it('returns the configured VITE_OSM_SERVER when set', () => {
    mutableEnv.VITE_OSM_SERVER = 'https://osm.example.org'
    expect(getOsmServerUrl()).toBe('https://osm.example.org')
  })

  it('falls back to the default OSM server when unset', () => {
    mutableEnv.VITE_OSM_SERVER = ''
    expect(getOsmServerUrl()).toBe('https://www.openstreetmap.org')
  })
})

const makeTask = (features: GeoJSON.Feature[], id = 1): Task =>
  ({
    id,
    geometries: { type: 'FeatureCollection', features },
  }) as Task

const feature = (
  properties: Record<string, unknown> | null,
  geometry: GeoJSON.Geometry = { type: 'Point', coordinates: [0, 0] }
): GeoJSON.Feature => ({
  type: 'Feature',
  geometry,
  properties,
})

describe('parseOsmFeatureFromTask / parseOsmFeaturesFromTask', () => {
  it('returns null when the task has no features', () => {
    const task = makeTask([])
    expect(parseOsmFeatureFromTask(task)).toBeNull()
    expect(parseOsmFeaturesFromTask(task)).toEqual([])
  })

  it('skips features with no properties', () => {
    const task = makeTask([feature(null)])
    expect(parseOsmFeatureFromTask(task)).toBeNull()
  })

  it('returns null when properties have no recognizable OSM id', () => {
    const task = makeTask([feature({ name: 'something' })])
    expect(parseOsmFeatureFromTask(task)).toBeNull()
  })

  describe('typed string id convention ("node/123" style)', () => {
    it('parses from "@id"', () => {
      const task = makeTask([feature({ '@id': 'node/123' })])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'node', id: 123 })
    })

    it('parses from "id"', () => {
      const task = makeTask([feature({ id: 'way/456' })])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'way', id: 456 })
    })

    it('parses from "osm_id"', () => {
      const task = makeTask([feature({ osm_id: 'relation/789' })])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'relation', id: 789 })
    })

    it('ignores a typed id string that does not match the "type/digits" pattern', () => {
      const task = makeTask([feature({ '@id': 'not-a-valid-id' })])
      expect(parseOsmFeatureFromTask(task)).toBeNull()
    })

    it('ignores a typed id that is not a string (falls through to numeric handling)', () => {
      // A non-string "id" falls through the typed-id branch; with no numeric
      // id fields present either, nothing is parsed.
      const task = makeTask([feature({ id: 123 })])
      expect(parseOsmFeatureFromTask(task)).toBeNull()
    })

    it('prefers "@id" over "id" and "osm_id" when multiple are present', () => {
      const task = makeTask([feature({ '@id': 'node/1', id: 'way/2', osm_id: 'relation/3' })])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'node', id: 1 })
    })
  })

  describe('numeric id convention with explicit type', () => {
    it('parses "osmid" with "@type"', () => {
      const task = makeTask([feature({ osmid: 111, '@type': 'Node' })])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'node', id: 111 })
    })

    it('parses "osm_id" with "osm_type"', () => {
      const task = makeTask([feature({ osm_id: 222, osm_type: 'way' })])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'way', id: 222 })
    })

    it('parses "@osmId" with "@type"', () => {
      const task = makeTask([feature({ '@osmId': 333, '@type': 'RELATION' })])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'relation', id: 333 })
    })

    it('accepts a numeric id given as a numeric string', () => {
      const task = makeTask([feature({ osmid: '444', '@type': 'way' })])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'way', id: 444 })
    })

    it('ignores a zero or negative numeric id', () => {
      const task = makeTask([feature({ osmid: 0, '@type': 'node' })])
      expect(parseOsmFeatureFromTask(task)).toBeNull()

      const negativeTask = makeTask([feature({ osmid: -5, '@type': 'node' })])
      expect(parseOsmFeatureFromTask(negativeTask)).toBeNull()
    })

    it('ignores a non-finite numeric id', () => {
      const task = makeTask([feature({ osmid: 'not-a-number', '@type': 'node' })])
      expect(parseOsmFeatureFromTask(task)).toBeNull()
    })

    it('falls back to geometry-inferred type when the explicit type value is unrecognized', () => {
      const task = makeTask([
        feature({ osmid: 55, '@type': 'bogus-type' }, { type: 'Point', coordinates: [0, 0] }),
      ])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'node', id: 55 })
    })
  })

  describe('numeric id convention with geometry-inferred type', () => {
    it('infers "node" from a Point geometry', () => {
      const task = makeTask([feature({ osmid: 1 }, { type: 'Point', coordinates: [0, 0] })])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'node', id: 1 })
    })

    it('infers "way" from a LineString geometry', () => {
      const task = makeTask([
        feature(
          { osmid: 2 },
          {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          }
        ),
      ])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'way', id: 2 })
    })

    it('infers "way" from a MultiLineString geometry', () => {
      const task = makeTask([
        feature(
          { osmid: 3 },
          {
            type: 'MultiLineString',
            coordinates: [
              [
                [0, 0],
                [1, 1],
              ],
            ],
          }
        ),
      ])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'way', id: 3 })
    })

    it('infers "way" from a Polygon geometry', () => {
      const task = makeTask([
        feature(
          { osmid: 4 },
          {
            type: 'Polygon',
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 0],
              ],
            ],
          }
        ),
      ])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'way', id: 4 })
    })

    it('infers "relation" from a MultiPolygon geometry', () => {
      const task = makeTask([
        feature(
          { osmid: 5 },
          {
            type: 'MultiPolygon',
            coordinates: [
              [
                [
                  [0, 0],
                  [1, 0],
                  [1, 1],
                  [0, 0],
                ],
              ],
            ],
          }
        ),
      ])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'relation', id: 5 })
    })

    it('returns null when geometry type is unrecognized and there is no explicit type', () => {
      const task = makeTask([
        feature({ osmid: 6 }, { type: 'GeometryCollection', geometries: [] } as GeoJSON.Geometry),
      ])
      expect(parseOsmFeatureFromTask(task)).toBeNull()
    })

    it('returns null when geometry is missing entirely and there is no explicit type', () => {
      const task = makeTask([
        {
          type: 'Feature',
          geometry: null as unknown as GeoJSON.Geometry,
          properties: { osmid: 7 },
        },
      ])
      expect(parseOsmFeatureFromTask(task)).toBeNull()
    })
  })

  describe('parseOsmFeaturesFromTask across multiple features', () => {
    it('collects one entry per feature that has a parseable OSM id', () => {
      const task = makeTask([
        feature({ '@id': 'node/1' }),
        feature({ name: 'no osm id here' }),
        feature(
          { osmid: 2 },
          {
            type: 'LineString',
            coordinates: [
              [0, 0],
              [1, 1],
            ],
          }
        ),
      ])
      expect(parseOsmFeaturesFromTask(task)).toEqual([
        { type: 'node', id: 1 },
        { type: 'way', id: 2 },
      ])
    })

    it('parseOsmFeatureFromTask returns only the first parseable feature', () => {
      const task = makeTask([feature({ '@id': 'node/1' }), feature({ '@id': 'way/2' })])
      expect(parseOsmFeatureFromTask(task)).toEqual({ type: 'node', id: 1 })
    })
  })
})

describe('formatOsmEntities', () => {
  it('returns an empty string when no features have usable OSM ids', () => {
    const task = makeTask([feature({ name: 'nothing here' })])
    expect(formatOsmEntities(task)).toBe('')
  })

  it('formats a single task with the full (JOSM-style) type prefix by default', () => {
    const task = makeTask([feature({ '@id': 'node/123' })])
    expect(formatOsmEntities(task)).toBe('node123')
  })

  it('formats with abbreviated (iD/Rapid-style) prefixes when requested', () => {
    const task = makeTask([feature({ '@id': 'way/456' })])
    expect(formatOsmEntities(task, { abbreviated: true })).toBe('w456')
  })

  it('joins multiple entities from a single task with commas', () => {
    const task = makeTask([feature({ '@id': 'node/1' }), feature({ '@id': 'way/2' })])
    expect(formatOsmEntities(task, { abbreviated: true })).toBe('n1,w2')
  })

  it('accepts an array of tasks and joins entities across all of them', () => {
    const taskA = makeTask([feature({ '@id': 'node/1' })], 1)
    const taskB = makeTask([feature({ '@id': 'relation/2' })], 2)
    expect(formatOsmEntities([taskA, taskB], { abbreviated: true })).toBe('n1,r2')
  })
})
