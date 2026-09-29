import { describe, expect, it } from 'vitest'
import { distributeFeatureProperties } from './featureProperties'

const edge = (osmIdentifier: string) => ({ itemType: 'Edge', osmIdentifier })
const highlight = () => ({ synthetic_highlight_point: 'yes' })

describe('distributeFeatureProperties', () => {
  it('matches entries to geometries of the same kind, whatever order they came in', () => {
    const container = {
      feature_properties: JSON.stringify([
        edge('717552192'),
        edge('461160934'),
        highlight(),
        highlight(),
      ]),
    }

    const out = distributeFeatureProperties(container, [
      'Point',
      'Point',
      'LineString',
      'LineString',
    ])

    expect(out).toEqual([highlight(), highlight(), edge('717552192'), edge('461160934')])
  })

  it('accepts an array that was not serialised as a string', () => {
    const out = distributeFeatureProperties({ feature_properties: [edge('1')] }, ['LineString'])
    expect(out).toEqual([edge('1')])
  })

  it('gives up when a kind has more entries than geometries', () => {
    const container = { feature_properties: JSON.stringify([edge('1'), edge('2'), highlight()]) }
    expect(distributeFeatureProperties(container, ['Point', 'LineString', 'Polygon'])).toBeNull()
  })

  it('gives up when the totals differ', () => {
    const container = { feature_properties: JSON.stringify([edge('1')]) }
    expect(distributeFeatureProperties(container, ['LineString', 'LineString'])).toBeNull()
  })

  it('gives up on an entry whose kind it cannot tell', () => {
    const container = { feature_properties: JSON.stringify([{ some: 'thing' }]) }
    expect(distributeFeatureProperties(container, ['LineString'])).toBeNull()
  })

  it('gives up when there is nothing packed to distribute', () => {
    expect(distributeFeatureProperties({}, ['LineString'])).toBeNull()
    expect(distributeFeatureProperties({ feature_properties: 'not json' }, ['Point'])).toBeNull()
  })
})
