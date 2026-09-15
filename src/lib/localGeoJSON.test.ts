import { describe, expect, it } from 'vitest'
import {
  detectLocalGeoJSONSubmission,
  isLineByLineGeoJSONText,
  isNewlineDelimitedGeoJSONText,
} from './localGeoJSON.ts'

const RS = '\x1e'

const featureCollection = (name: string) =>
  JSON.stringify({
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [-95.454772, 37.6866588] },
        properties: { name },
      },
    ],
  })

describe('local GeoJSON submission detection', () => {
  it('detects RFC 7464 record-separated line-by-line GeoJSON', async () => {
    const body = `${RS}${featureCollection('one')}\n${RS}${featureCollection('two')}\n`
    const file = new File([body], 'tasks.geojson')

    expect(isLineByLineGeoJSONText(body)).toBe(true)
    await expect(detectLocalGeoJSONSubmission(file)).resolves.toMatchObject({
      kind: 'lineByLine',
      file,
    })
  })

  it('detects newline-delimited GeoJSON with no record separators', async () => {
    // What MapRoulette 3's own pre-bundled uploads look like: one collection
    // per line, joined by plain newlines.
    const body = `${featureCollection('one')}\n${featureCollection('two')}\n`
    const file = new File([body], 'tasks.geojson')

    expect(isLineByLineGeoJSONText(body)).toBe(false)
    expect(isNewlineDelimitedGeoJSONText(body)).toBe(true)
    await expect(detectLocalGeoJSONSubmission(file)).resolves.toMatchObject({
      kind: 'lineByLine',
      file,
    })
  })

  it('treats a pretty-printed single collection as one document, not many', async () => {
    const body = JSON.stringify(JSON.parse(featureCollection('one')), null, 2)
    const file = new File([body], 'tasks.geojson')

    expect(isNewlineDelimitedGeoJSONText(body)).toBe(false)
    await expect(detectLocalGeoJSONSubmission(file)).resolves.toMatchObject({ kind: 'json' })
  })

  it('parses unformatted GeoJSON as a JSON challenge payload', async () => {
    const body = JSON.stringify({
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-97.3452936, 38.0446222] },
          properties: { name: 'The Bread Basket' },
        },
      ],
    })
    const file = new File([body], 'tasks.geojson')

    expect(isLineByLineGeoJSONText(body)).toBe(false)
    await expect(detectLocalGeoJSONSubmission(file)).resolves.toMatchObject({
      kind: 'json',
      geoJSON: JSON.parse(body),
    })
  })

  it('parses formatted (pretty-printed) GeoJSON as a JSON challenge payload', async () => {
    const body = JSON.stringify(JSON.parse(featureCollection('pretty')), null, 2)
    const file = new File([body], 'tasks.geojson')

    expect(isLineByLineGeoJSONText(body)).toBe(false)
    await expect(detectLocalGeoJSONSubmission(file)).resolves.toMatchObject({ kind: 'json' })
  })
})
