import { describe, expect, it } from 'vitest'
import { resolveFeatureStyle } from './taskFeatureStyle'

const feature = (properties: Record<string, unknown>): GeoJSON.Feature => ({
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

describe('resolveFeatureStyle', () => {
  it("reads the feature's own simplestyle properties", () => {
    expect(
      resolveFeatureStyle(
        feature({
          stroke: '#FF00FF',
          'stroke-width': 3,
          'stroke-opacity': 0.5,
          fill: '#00FFFF',
          'fill-opacity': '0.25',
          'marker-color': 'rgb(1, 2, 3)',
        })
      )
    ).toEqual({
      stroke: '#FF00FF',
      strokeWidth: 3,
      strokeOpacity: 0.5,
      fill: '#00FFFF',
      fillOpacity: 0.25,
      markerColor: 'rgb(1, 2, 3)',
    })
  })

  it('ignores styles it cannot draw with, rather than passing them to the map', () => {
    // An unparseable color in a paint expression takes the whole layer down.
    expect(resolveFeatureStyle(feature({ stroke: 'not a color', 'stroke-width': 'wide' }))).toEqual(
      {}
    )
    expect(resolveFeatureStyle(feature({ 'stroke-opacity': 4, 'stroke-width': 0 }))).toEqual({})
    expect(resolveFeatureStyle(feature({ highway: 'service' }))).toEqual({})
  })
})
