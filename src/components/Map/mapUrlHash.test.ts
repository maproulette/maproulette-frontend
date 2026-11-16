import { describe, expect, it } from 'vitest'
import { formatMapHash, parseMapHash } from './mapUrlHash'

const camera = (lng: number, lat: number, zoom: number, bearing = 0, pitch = 0) => ({
  getCenter: () => ({ lng, lat }) as maplibregl.LngLat,
  getZoom: () => zoom,
  getBearing: () => bearing,
  getPitch: () => pitch,
})

describe('formatMapHash', () => {
  it('writes zoom/lat/lng with precision that grows with zoom, as MapLibre does', () => {
    expect(formatMapHash(camera(-122.4194155, 37.7749295, 2))).toBe('#2/37.77/-122.42')
    expect(formatMapHash(camera(-122.4194123, 37.7749261, 15.678))).toBe(
      '#15.68/37.774926/-122.419412'
    )
  })

  it('adds bearing only when the map is rotated or pitched, and pitch only when pitched', () => {
    expect(formatMapHash(camera(10, 20, 5, 12.34))).toBe('#5/20/10/12.3')
    expect(formatMapHash(camera(10, 20, 5, 0, 30.4))).toBe('#5/20/10/0/30')
  })
})

describe('parseMapHash', () => {
  it('reads back what formatMapHash writes', () => {
    expect(parseMapHash('#15.68/37.77493/-122.41942')).toEqual({
      center: [-122.41942, 37.77493],
      zoom: 15.68,
      bearing: 0,
      pitch: 0,
    })
    expect(parseMapHash('#5/20/10/12.3/30')).toEqual({
      center: [10, 20],
      zoom: 5,
      bearing: 12.3,
      pitch: 30,
    })
  })

  it.each([
    '',
    '#',
    '#5/20',
    '#5//10',
    '#a/20/10',
    '#5/95/10',
    '#30/20/10',
    '#5/20/10/200',
    '#5/20/10/0/90',
    '#5/20/10/0/0/1',
    '#tab=comments',
  ])('ignores %j', (hash) => {
    expect(parseMapHash(hash)).toBeNull()
  })
})
