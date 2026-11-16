import { describe, expect, it } from 'vitest'
import { buildDirectionEndpoints, hasDirectionalGeometry } from './directionIndicators'

const line = (
  coordinates: GeoJSON.Position[],
  properties: Record<string, unknown> = {}
): GeoJSON.Feature => ({
  type: 'Feature',
  properties,
  geometry: { type: 'LineString', coordinates },
})

describe('hasDirectionalGeometry', () => {
  it('is true when any feature is a line', () => {
    expect(
      hasDirectionalGeometry([
        line([
          [0, 0],
          [1, 1],
        ]),
      ])
    ).toBe(true)
    expect(
      hasDirectionalGeometry([
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
        line([
          [0, 0],
          [1, 1],
        ]),
      ])
    ).toBe(true)
  })

  it('is false when nothing has a direction', () => {
    expect(
      hasDirectionalGeometry([
        { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
      ])
    ).toBe(false)
    expect(hasDirectionalGeometry([])).toBe(false)
  })
})

describe('buildDirectionEndpoints', () => {
  it('marks the first coordinate as the start and the last as the end', () => {
    const { features } = buildDirectionEndpoints([
      line(
        [
          [0, 0],
          [1, 1],
          [2, 3],
        ],
        { featureKey: '5:0', taskId: 5 }
      ),
    ])

    expect(features).toHaveLength(2)
    expect(features[0].properties).toEqual({
      role: 'start',
      featureKey: '5:0',
      taskId: 5,
      lineIndex: 0,
    })
    expect(features[0].geometry.coordinates).toEqual([0, 0])
    expect(features[1].properties.role).toBe('end')
    expect(features[1].geometry.coordinates).toEqual([2, 3])
  })

  it('covers every feature of a FeatureCollection task and every part of a multi-line', () => {
    const { features } = buildDirectionEndpoints([
      line(
        [
          [0, 0],
          [1, 0],
        ],
        { featureKey: '5:0' }
      ),
      {
        type: 'Feature',
        properties: { featureKey: '5:1' },
        geometry: {
          type: 'MultiLineString',
          coordinates: [
            [
              [0, 0],
              [0, 1],
            ],
            [
              [4, 4],
              [5, 5],
            ],
          ],
        },
      },
    ])

    expect(features).toHaveLength(6)
    expect(features.filter((f) => f.properties.role === 'start')).toHaveLength(3)
    expect(features.map((f) => f.properties.lineIndex)).toEqual([0, 0, 0, 0, 1, 1])
  })

  it('skips geometry with no direction to show', () => {
    const { features } = buildDirectionEndpoints([
      // A closed ring would stack both markers on the same point
      line([
        [0, 0],
        [1, 1],
        [0, 0],
      ]),
      // A single-position line has no direction at all
      line([[3, 3]]),
      { type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [0, 0] } },
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [0, 0],
              [1, 0],
              [1, 1],
              [0, 0],
            ],
          ],
        },
      },
    ])

    expect(features).toEqual([])
  })

  it('leaves the owning identity null when the feature was not decorated', () => {
    const { features } = buildDirectionEndpoints([
      line([
        [0, 0],
        [1, 1],
      ]),
    ])

    expect(features[0].properties.featureKey).toBeNull()
    expect(features[0].properties.taskId).toBeNull()
  })
})
