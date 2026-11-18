import { describe, expect, it } from 'vitest'
import type { Task } from '@/types/Task'
import {
  atticBbox,
  atticDate,
  atticQuery,
  josmAtticImportUrl,
  overpassTurboAtticUrl,
} from './overpassAttic.ts'

const makeTask = (features: unknown[]): Task =>
  ({ id: 1, geometries: { type: 'FeatureCollection', features } }) as unknown as Task

const point = (lon: number, lat: number) => ({
  type: 'Feature',
  properties: {},
  geometry: { type: 'Point', coordinates: [lon, lat] },
})

describe('overpassAttic', () => {
  it('has no bbox for a task without geometry', () => {
    expect(atticBbox(makeTask([]))).toBeNull()
  })

  it('pads the task bbox so a point task still covers an area', () => {
    const [west, south, east, north] = atticBbox(makeTask([point(10, 50)])) ?? []
    expect(west).toBeCloseTo(9.999)
    expect(south).toBeCloseTo(49.999)
    expect(east).toBeCloseTo(10.001)
    expect(north).toBeCloseTo(50.001)
  })

  it('covers every feature in the task', () => {
    const [west, south, east, north] = atticBbox(makeTask([point(10, 50), point(11, 51)])) ?? []
    expect(west).toBeCloseTo(9.999)
    expect(north).toBeCloseTo(51.001)
    expect(east).toBeCloseTo(11.001)
    expect(south).toBeCloseTo(49.999)
  })

  it('looks ten minutes past the history entry', () => {
    expect(atticDate('2026-11-18T12:00:00Z')).toBe('2026-11-18T12:10:00.000Z')
  })

  it('builds an attic query with the bbox in south,west,north,east order', () => {
    expect(atticQuery([1, 2, 3, 4], '2026-11-18T12:10:00.000Z')).toBe(
      '[out:xml][timeout:150][bbox:2,1,4,3][date:"2026-11-18T12:10:00.000Z"];' +
        '( node(2,1,4,3); <; >; );out meta;'
    )
  })

  it('opens the query in Overpass Turbo', () => {
    const url = new URL(overpassTurboAtticUrl([1, 2, 3, 4], '2026-11-18T12:10:00.000Z'))
    expect(url.origin + url.pathname).toBe('https://overpass-turbo.eu/map.html')
    expect(url.searchParams.get('Q')).toBe(atticQuery([1, 2, 3, 4], '2026-11-18T12:10:00.000Z'))
  })

  it('imports the query into JOSM as a read-only layer', () => {
    const url = new URL(
      josmAtticImportUrl('http://127.0.0.1:8111/', [1, 2, 3, 4], '2026-11-18T12:10:00.000Z')
    )
    expect(url.pathname).toBe('/import')
    expect(url.searchParams.get('new_layer')).toBe('true')
    expect(url.searchParams.get('layer_name')).toBe('2026-11-18T12:10:00.000Z')
    expect(url.searchParams.get('upload_policy')).toBe('never')
    expect(url.searchParams.get('download_policy')).toBe('never')
    const overpass = new URL(url.searchParams.get('url') ?? '')
    expect(overpass.origin + overpass.pathname).toBe('https://overpass-api.de/api/interpreter')
    expect(overpass.searchParams.get('data')).toBe(
      atticQuery([1, 2, 3, 4], '2026-11-18T12:10:00.000Z')
    )
  })
})
