import { describe, expect, it } from 'vitest'
import { matchesPropertySearch, parseStyleRules, resolveFeatureStyle } from './taskFeatureStyle'

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

  it('lets a matching challenge style rule override the feature and leaves others alone', () => {
    const rules = parseStyleRules([
      {
        propertySearch: { key: 'highway', operationType: 'equals', value: 'service' },
        styles: [{ styleName: 'stroke', styleValue: '#123456' }],
      },
      {
        propertySearch: { key: 'highway', operationType: 'equals', value: 'motorway' },
        styles: [{ styleName: 'stroke', styleValue: '#abcdef' }],
      },
    ])

    expect(resolveFeatureStyle(feature({ stroke: '#FF0000', highway: 'service' }), rules)).toEqual({
      stroke: '#123456',
    })
    expect(resolveFeatureStyle(feature({ stroke: '#FF0000', highway: 'primary' }), rules)).toEqual({
      stroke: '#FF0000',
    })
  })

  it('accepts the camelCase style names challenge rules also use', () => {
    const rules = parseStyleRules([
      {
        propertySearch: { key: 'oneway', operationType: 'exists' },
        styles: [
          { styleName: 'strokeColor', styleValue: '#0f0' },
          { styleName: 'strokeWidth', styleValue: '6' },
        ],
      },
    ])

    expect(resolveFeatureStyle(feature({ oneway: 'yes' }), rules)).toEqual({
      stroke: '#0f0',
      strokeWidth: 6,
    })
  })
})

describe('matchesPropertySearch', () => {
  const properties = { highway: 'service', lanes: '2', name: 'Main Street' }

  it('handles the operators a challenge can filter on', () => {
    const matches = (search: Parameters<typeof matchesPropertySearch>[1]) =>
      matchesPropertySearch(properties, search)

    expect(matches({ key: 'highway', operationType: 'equals', value: 'service' })).toBe(true)
    expect(matches({ key: 'highway', operationType: 'equals', value: 'primary' })).toBe(false)
    expect(matches({ key: 'highway', operationType: 'notEqual', value: 'primary' })).toBe(true)
    expect(matches({ key: 'name', operationType: 'contains', value: 'Main' })).toBe(true)
    expect(matches({ key: 'surface', operationType: 'missing' })).toBe(true)
    expect(matches({ key: 'surface', operationType: 'exists' })).toBe(false)
    // "2" compares as a number, not a string, so it is not greater than "10"
    expect(matches({ key: 'lanes', operationType: 'greaterThan', value: '10' })).toBe(false)
    expect(matches({ key: 'lanes', operationType: 'lessThanOrEqual', value: 2 })).toBe(true)
  })

  it('combines nested searches with and/or', () => {
    const left = { key: 'highway', operationType: 'equals', value: 'service' }
    const right = { key: 'lanes', operationType: 'equals', value: '4' }

    expect(matchesPropertySearch(properties, { left, right, condition: 'and' })).toBe(false)
    expect(matchesPropertySearch(properties, { left, right, condition: 'or' })).toBe(true)
  })

  it('matches nothing when given no search at all', () => {
    expect(matchesPropertySearch(properties, undefined)).toBe(false)
    expect(matchesPropertySearch(properties, { operationType: 'equals', value: 'x' })).toBe(false)
  })
})

describe('parseStyleRules', () => {
  it('keeps only entries shaped like a style rule', () => {
    expect(
      parseStyleRules([
        { propertySearch: { key: 'a' }, styles: [] },
        { styles: [] },
        { propertySearch: { key: 'b' } },
        'nonsense',
        null,
      ])
    ).toEqual([{ propertySearch: { key: 'a' }, styles: [] }])
  })

  it('is empty for a challenge with no styles', () => {
    expect(parseStyleRules(undefined)).toEqual([])
    expect(parseStyleRules(null)).toEqual([])
    expect(parseStyleRules('[]')).toEqual([])
  })
})
