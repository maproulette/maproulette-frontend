import type { Map as MapInstance } from 'maplibre-gl'

export interface MapHashView {
  center: [number, number]
  zoom: number
  bearing: number
  pitch: number
}

export const formatMapHash = (
  map: Pick<MapInstance, 'getCenter' | 'getZoom' | 'getBearing' | 'getPitch'>
): string => {
  const center = map.getCenter()
  const zoom = Math.round(map.getZoom() * 100) / 100
  const precision = Math.ceil((zoom * Math.LN2 + Math.log(512 / 360 / 0.5)) / Math.LN10)
  const m = 10 ** precision
  const lng = Math.round(center.lng * m) / m
  const lat = Math.round(center.lat * m) / m
  const bearing = map.getBearing()
  const pitch = map.getPitch()

  let hash = `#${zoom}/${lat}/${lng}`
  if (bearing || pitch) hash += `/${Math.round(bearing * 10) / 10}`
  if (pitch) hash += `/${Math.round(pitch)}`
  return hash
}

export const parseMapHash = (hash: string): MapHashView | null => {
  const parts = hash.replace(/^#/, '').split('/')
  if (parts.length < 3 || parts.length > 5) return null
  if (parts.some((part) => part.trim() === '')) return null

  const [zoom, lat, lng, bearing = 0, pitch = 0] = parts.map(Number)
  if (![zoom, lat, lng, bearing, pitch].every(Number.isFinite)) return null
  if (zoom < 0 || zoom > 24) return null
  if (lat < -90 || lat > 90) return null
  if (bearing < -180 || bearing > 180) return null
  if (pitch < 0 || pitch > 85) return null

  return { center: [lng, lat], zoom, bearing, pitch }
}
