const NOMINATIM_BASE_URL =
  window.env.VITE_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org'

type OsmType = 'node' | 'way' | 'relation'

export interface PlaceSuggestion {
  display_name: string
  place_id: string
  osm_type?: OsmType
  osm_id?: number
  type?: string
  importance?: number
  boundingbox?: string[]
}

export type AreaGeometry =
  | {
      type: 'Polygon'
      coordinates: number[][][]
    }
  | {
      type: 'MultiPolygon'
      coordinates: number[][][][]
    }

type Geometry = AreaGeometry | { type: 'Point' | 'LineString' | 'MultiLineString' }

export const isAreaGeometry = (geometry: Geometry | undefined): geometry is AreaGeometry =>
  geometry?.type === 'Polygon' || geometry?.type === 'MultiPolygon'

export interface PlaceDetail {
  display_name: string
  boundingbox?: string[]
  geojson?: Geometry
}

export interface ReverseGeocodeResult {
  address?: Record<string, string>
  display_name?: string
}

const fetchJSON = async <T>(path: string, params: Record<string, string>, signal?: AbortSignal) => {
  const response = await fetch(`${NOMINATIM_BASE_URL}${path}?${new URLSearchParams(params)}`, {
    signal,
  })
  if (!response.ok) throw new Error(`Nominatim error: ${response.status} ${response.statusText}`)
  return (await response.json()) as T
}

/**
 * Places matching the query that are areas, since only an area can be used to
 * filter challenges by location. Nominatim can't filter by geometry type, so
 * this asks for (heavily simplified) geometries and filters them here.
 */
export const searchAreas = async (
  query: string,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> => {
  const places = await fetchJSON<Array<PlaceSuggestion & { geojson?: Geometry }>>(
    '/search',
    {
      format: 'json',
      q: query,
      limit: '20',
      addressdetails: '1',
      polygon_geojson: '1',
      polygon_threshold: '0.1',
    },
    signal
  )
  return places
    .filter((place) => isAreaGeometry(place.geojson))
    .slice(0, 8)
    .map(({ geojson: _, ...place }) => place)
}

export const lookupPlace = async (
  osmId: string,
  signal?: AbortSignal
): Promise<PlaceDetail | null> => {
  const places = await fetchJSON<PlaceDetail[]>(
    '/lookup',
    { osm_ids: osmId, polygon_geojson: '1', format: 'jsonv2' },
    signal
  )
  return places[0] ?? null
}

export const reverseGeocode = (
  latitude: number,
  longitude: number,
  zoom: number,
  signal?: AbortSignal
): Promise<ReverseGeocodeResult> =>
  fetchJSON(
    '/reverse',
    { format: 'json', zoom: String(zoom), lat: String(latitude), lon: String(longitude) },
    signal
  )
