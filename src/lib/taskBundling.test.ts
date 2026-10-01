import { describe, expect, it } from 'vitest'
import { bundleGeoJSONText, featuresFromGeoJSONText, groupFeaturesByProperty } from './taskBundling'

const RS = '\x1e'

const feature = (properties: Record<string, unknown>) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [0, 0] },
  properties,
})

const collection = (...features: ReturnType<typeof feature>[]) =>
  JSON.stringify({ type: 'FeatureCollection', features })

const linesOf = (bundled: string) => bundled.split('\n').map((line) => JSON.parse(line))

describe('featuresFromGeoJSONText', () => {
  it('reads the features of a single FeatureCollection', () => {
    const text = collection(feature({ name: 'one' }), feature({ name: 'two' }))

    expect(featuresFromGeoJSONText(text)).toHaveLength(2)
  })

  it('reads a bare Feature as a single feature', () => {
    expect(featuresFromGeoJSONText(JSON.stringify(feature({ name: 'alone' })))).toHaveLength(1)
  })

  it('flattens newline-delimited collections back into one feature list', () => {
    const text = `${collection(feature({ name: 'one' }))}\n${collection(feature({ name: 'two' }), feature({ name: 'three' }))}`

    expect(featuresFromGeoJSONText(text)).toHaveLength(3)
  })

  it('flattens RFC 7464 framed collections, stripping the record separators', () => {
    const text = `${RS}${collection(feature({ name: 'one' }))}\n${RS}${collection(feature({ name: 'two' }))}\n`

    expect(featuresFromGeoJSONText(text)).toHaveLength(2)
  })

  it('rejects GeoJSON that is neither a Feature nor a FeatureCollection', () => {
    expect(() => featuresFromGeoJSONText('{"type":"Point","coordinates":[0,0]}')).toThrow(
      /Unsupported GeoJSON type/
    )
  })

  it('propagates a parse failure rather than returning an empty list', () => {
    expect(() => featuresFromGeoJSONText('not json at all')).toThrow()
  })
})

describe('groupFeaturesByProperty', () => {
  it('groups features sharing a value and keeps first-seen order', () => {
    const features = [
      feature({ bundle: 'b', name: 'first-b' }),
      feature({ bundle: 'a', name: 'first-a' }),
      feature({ bundle: 'b', name: 'second-b' }),
    ]

    const groups = groupFeaturesByProperty(features, 'bundle')

    expect(groups.map((group) => group.map((f) => f.properties?.name))).toEqual([
      ['first-b', 'second-b'],
      ['first-a'],
    ])
  })

  it('leaves features without the property as isolated groups, in place', () => {
    const features = [
      feature({ bundle: 'a', name: 'grouped' }),
      feature({ name: 'loner' }),
      feature({ bundle: 'a', name: 'also-grouped' }),
    ]

    const groups = groupFeaturesByProperty(features, 'bundle')

    expect(groups.map((group) => group.map((f) => f.properties?.name))).toEqual([
      ['grouped', 'also-grouped'],
      ['loner'],
    ])
  })

  it('treats a null or empty bundle id as no bundle id rather than a shared one', () => {
    const features = [
      feature({ bundle: null, name: 'null-one' }),
      feature({ bundle: '', name: 'empty' }),
      feature({ bundle: null, name: 'null-two' }),
    ]

    expect(groupFeaturesByProperty(features, 'bundle')).toHaveLength(3)
  })

  it('matches ids that differ only by type, since the backend sees them as one value', () => {
    const features = [
      feature({ bundle: 7, name: 'numeric' }),
      feature({ bundle: '7', name: 'text' }),
    ]

    expect(groupFeaturesByProperty(features, 'bundle')).toHaveLength(1)
  })
})

describe('bundleGeoJSONText', () => {
  it('emits one FeatureCollection per line, each holding a whole bundle', () => {
    const text = collection(
      feature({ bundle: 'a', name: 'one' }),
      feature({ bundle: 'b', name: 'two' }),
      feature({ bundle: 'a', name: 'three' })
    )

    const lines = linesOf(bundleGeoJSONText(text, 'bundle'))

    expect(lines).toHaveLength(2)
    expect(lines[0]).toEqual({
      type: 'FeatureCollection',
      features: [feature({ bundle: 'a', name: 'one' }), feature({ bundle: 'a', name: 'three' })],
    })
    expect(lines[1].features).toHaveLength(1)
  })

  it('regroups an already line-by-line file rather than trusting its existing lines', () => {
    const text = `${collection(feature({ bundle: 'a', name: 'one' }))}\n${collection(feature({ bundle: 'a', name: 'two' }))}`

    const lines = linesOf(bundleGeoJSONText(text, 'bundle'))

    expect(lines).toHaveLength(1)
    expect(lines[0].features).toHaveLength(2)
  })

  it('produces one line per feature when no feature carries the property', () => {
    const text = collection(feature({ name: 'one' }), feature({ name: 'two' }))

    expect(linesOf(bundleGeoJSONText(text, 'bundle'))).toHaveLength(2)
  })

  it('writes each bundle as compact single-line JSON, so lines stay parseable', () => {
    const text = collection(feature({ bundle: 'a' }), feature({ bundle: 'b' }))

    const bundled = bundleGeoJSONText(text, 'bundle')

    expect(bundled).not.toContain('\n}')
    expect(bundled.split('\n').every((line) => JSON.parse(line).type === 'FeatureCollection')).toBe(
      true
    )
  })
})
