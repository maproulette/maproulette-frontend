import { describe, expect, it } from 'vitest'
import type { Task } from '@/types/Task'
import { decorateTaskFeatures, taskFeatureKey } from './decorateTaskFeatures.ts'

const makeTask = (features: GeoJSON.Feature[]): Task =>
  ({
    id: 42,
    geometries: { type: 'FeatureCollection', features },
  }) as Task

describe('decorateTaskFeatures', () => {
  it('stamps the owning task and feature identity onto each feature while preserving existing properties', () => {
    const feature: GeoJSON.Feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [1, 2] },
      properties: { name: 'a' },
    }
    const task = makeTask([feature])

    const result = decorateTaskFeatures(task)

    expect(result.type).toBe('FeatureCollection')
    expect(result.features).toHaveLength(1)
    expect(result.features[0].properties).toEqual({
      name: 'a',
      taskId: 42,
      featureIndex: 0,
      featureKey: '42:0',
      partKey: '42:0',
    })
    expect(result.features[0].geometry).toEqual(feature.geometry)
  })

  it('decorates every feature when the task has multiple features', () => {
    const task = makeTask([
      { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: null },
      { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 1] }, properties: { a: 1 } },
    ])

    const result = decorateTaskFeatures(task)

    expect(result.features).toHaveLength(2)
    expect(result.features[0].properties).toEqual({
      taskId: 42,
      featureIndex: 0,
      featureKey: '42:0',
      partKey: '42:0',
    })
    expect(result.features[1].properties).toEqual({
      a: 1,
      taskId: 42,
      featureIndex: 1,
      featureKey: '42:1',
      partKey: '42:1',
    })
  })

  it('returns an empty feature collection when the task has no features', () => {
    const task = makeTask([])

    const result = decorateTaskFeatures(task)

    expect(result).toEqual({ type: 'FeatureCollection', features: [] })
  })

  it("attaches the colors the feature's own simplestyle asked for", () => {
    const task = makeTask([
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [1, 1],
          ],
        },
        properties: { stroke: '#FF00FF', 'stroke-width': 3 },
      },
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [1, 2] },
        properties: { highway: 'crossing' },
      },
    ])

    const [styled, plain] = decorateTaskFeatures(task).features

    expect(styled.properties).toMatchObject({
      mrStroke: '#FF00FF',
      mrStrokeWidth: 3,
      // A line with no fill or marker color of its own still draws in its stroke
      mrFill: '#FF00FF',
      mrMarkerColor: '#FF00FF',
    })
    // Nothing is attached for a feature the data said nothing about, so the
    // layer's own default color applies.
    expect(plain.properties).not.toHaveProperty('mrStroke')
    expect(plain.properties).not.toHaveProperty('mrStrokeWidth')
  })

  it('applies matching challenge style rules over the feature simplestyle', () => {
    const task = makeTask([
      {
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0],
            [1, 1],
          ],
        },
        properties: { stroke: '#FF0000', highway: 'service' },
      },
    ])

    const [feature] = decorateTaskFeatures(task, [
      {
        propertySearch: { key: 'highway', operationType: 'equals', value: 'service' },
        styles: [{ styleName: 'stroke', styleValue: '#00FF00' }],
      },
    ]).features

    expect(feature.properties).toMatchObject({ mrStroke: '#00FF00' })
  })

  it('keys a feature by its position within the task that owns it', () => {
    expect(taskFeatureKey(42, 0)).toBe('42:0')
    expect(taskFeatureKey(42, 3)).toBe('42:3')
  })

  it('does not mutate the original task features', () => {
    const feature: GeoJSON.Feature = {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [1, 2] },
      properties: { name: 'a' },
    }
    const task = makeTask([feature])

    decorateTaskFeatures(task)

    expect(feature.properties).toEqual({ name: 'a' })
  })

  it('expands a GeometryCollection into one feature per member geometry', () => {
    const task = {
      id: 336355067,
      geometries: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { name: 'RoadNameSpellingConsistencyCheck (highway=primary)' },
            geometry: {
              type: 'GeometryCollection',
              geometries: [
                {
                  type: 'MultiPoint',
                  coordinates: [
                    [19.8299979, 41.3287965],
                    [19.8291332, 41.3284302],
                  ],
                },
                {
                  type: 'MultiLineString',
                  coordinates: [
                    [
                      [19.8299979, 41.3287965],
                      [19.8298031, 41.3287139],
                    ],
                  ],
                },
              ],
            },
          },
        ],
      },
    } as unknown as Task

    const { features } = decorateTaskFeatures(task)

    expect(features.map((f) => f.geometry.type)).toEqual(['Point', 'Point', 'LineString'])
    expect(features.map((f) => f.properties?.featureKey)).toEqual([
      '336355067:0',
      '336355067:0',
      '336355067:1',
    ])
    expect(features.map((f) => f.properties?.partKey)).toEqual([
      '336355067:0:0',
      '336355067:0:1',
      '336355067:1:0',
    ])
    expect(features[0].properties?.name).toBe('RoadNameSpellingConsistencyCheck (highway=primary)')
  })

  it('draws a Multi* as one feature per part, each under its own part key', () => {
    const task = makeTask([
      {
        type: 'Feature',
        properties: { name: 'legs' },
        geometry: {
          type: 'MultiLineString',
          coordinates: [
            [
              [0, 0],
              [1, 1],
            ],
            [
              [2, 2],
              [3, 3],
            ],
          ],
        },
      },
    ])

    const { features } = decorateTaskFeatures(task)

    expect(features.map((f) => f.geometry.type)).toEqual(['LineString', 'LineString'])
    // Every part keeps the owning feature's key, so acting on the whole
    // MultiLineString still reaches all of them.
    expect(features.map((f) => f.properties?.featureKey)).toEqual(['42:0', '42:0'])
    expect(features.map((f) => f.properties?.partKey)).toEqual(['42:0:0', '42:0:1'])
    expect(features.map((f) => f.properties?.name)).toEqual(['legs', 'legs'])
    expect(features[1].geometry).toEqual({
      type: 'LineString',
      coordinates: [
        [2, 2],
        [3, 3],
      ],
    })
  })

  it('expands nested GeometryCollections', () => {
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
                {
                  type: 'GeometryCollection',
                  geometries: [{ type: 'Point', coordinates: [1, 2] }],
                },
                {
                  type: 'LineString',
                  coordinates: [
                    [1, 2],
                    [3, 4],
                  ],
                },
              ],
            },
          },
        ],
      },
    } as unknown as Task

    expect(decorateTaskFeatures(task).features.map((f) => f.geometry.type)).toEqual([
      'Point',
      'LineString',
    ])
  })

  it('drops a feature id too large for a vector tile', () => {
    const task = {
      id: 1,
      geometries: {
        type: 'FeatureCollection',
        features: [
          {
            id: '514198842000000676919290000002676919290000003676919290000004676919290000005676919290000006',
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: [1, 2] },
          },
        ],
      },
    } as unknown as Task

    expect(decorateTaskFeatures(task).features[0]).not.toHaveProperty('id')
  })

  it('keeps a feature id a vector tile can encode', () => {
    const task = {
      id: 1,
      geometries: {
        type: 'FeatureCollection',
        features: [
          {
            id: 42,
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: [1, 2] },
          },
          {
            id: '99',
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: [3, 4] },
          },
        ],
      },
    } as unknown as Task

    expect(decorateTaskFeatures(task).features.map((f) => f.id)).toEqual([42, '99'])
  })

  it('treats a task with no features as nothing to draw', () => {
    const task = {
      id: 9,
      geometries: { type: 'FeatureCollection', features: null },
    } as unknown as Task
    expect(decorateTaskFeatures(task).features).toEqual([])
  })
})
