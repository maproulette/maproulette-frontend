import bbox from '@turf/bbox'
import type { Bbox2D } from '@/types/Map'
import type { Task } from '@/types/Task'

const ATTIC_OFFSET_MINUTES = 10
const ATTIC_BBOX_PADDING_DEGREES = 0.001

export const atticBbox = (task: Task): Bbox2D | null => {
  const [west, south, east, north] = bbox(task.geometries) as Bbox2D
  if (![west, south, east, north].every(Number.isFinite)) return null
  return [
    west - ATTIC_BBOX_PADDING_DEGREES,
    south - ATTIC_BBOX_PADDING_DEGREES,
    east + ATTIC_BBOX_PADDING_DEGREES,
    north + ATTIC_BBOX_PADDING_DEGREES,
  ]
}

export const atticDate = (timestamp: string | Date): string =>
  new Date(new Date(timestamp).getTime() + ATTIC_OFFSET_MINUTES * 60_000).toISOString()

export const atticQuery = ([west, south, east, north]: Bbox2D, date: string): string => {
  const overpassBbox = [south, west, north, east].join(',')
  return (
    `[out:xml][timeout:150][bbox:${overpassBbox}][date:"${date}"];` +
    `( node(${overpassBbox}); <; >; );` +
    'out meta;'
  )
}

export const overpassTurboAtticUrl = (bounds: Bbox2D, date: string): string =>
  `https://overpass-turbo.eu/map.html?Q=${encodeURIComponent(atticQuery(bounds, date))}`

export const josmAtticImportUrl = (josmHost: string, bounds: Bbox2D, date: string): string => {
  const overpassUrl = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(atticQuery(bounds, date))}`
  const parts = [
    'new_layer=true',
    `layer_name=${encodeURIComponent(date)}`,
    'upload_policy=never',
    'download_policy=never',
    `url=${encodeURIComponent(overpassUrl)}`,
  ]
  return `${josmHost.replace(/\/+$/, '')}/import?${parts.join('&')}`
}
