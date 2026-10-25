const NOMINATIM_BASE_URL =
  window.env.VITE_NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org'

export type OsmType = 'node' | 'way' | 'relation'

export interface PlaceSuggestion {
  display_name: string
  place_id: string
  osm_type?: OsmType
  osm_id?: number
  type?: string
  importance?: number
  boundingbox?: string[]
}

export interface PlaceDetail {
  display_name: string
  boundingbox?: string[]
  geojson?:
    | {
        type: 'Polygon'
        coordinates: number[][][]
      }
    | {
        type: 'MultiPolygon'
        coordinates: number[][][][]
      }
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

export const nominatim = {
  search: (query: string, signal?: AbortSignal): Promise<PlaceSuggestion[]> =>
    fetchJSON('/search', { format: 'json', q: query, limit: '8', addressdetails: '1' }, signal),

  lookup: async (osmId: string, signal?: AbortSignal): Promise<PlaceDetail | null> => {
    const places = await fetchJSON<PlaceDetail[]>(
      '/lookup',
      { osm_ids: osmId, polygon_geojson: '1', format: 'jsonv2' },
      signal
    )
    return places[0] ?? null
  },

  reverse: (
    latitude: number,
    longitude: number,
    zoom: number,
    signal?: AbortSignal
  ): Promise<ReverseGeocodeResult> =>
    fetchJSON(
      '/reverse',
      { format: 'json', zoom: String(zoom), lat: String(latitude), lon: String(longitude) },
      signal
    ),
}
