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
    })
    expect(result.features[1].properties).toEqual({
      a: 1,
      taskId: 42,
      featureIndex: 1,
      featureKey: '42:1',
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
})
