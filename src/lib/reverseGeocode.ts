import { nominatim } from '@/api/nominatim'
import { logger } from '@/lib/logger'

/** Town/city level rather than a house number, which is what a mapper wants to read. */
const ZOOM = 10

/** First present field, so a rural point still resolves to something recognisable. */
const PLACE_FIELDS = ['city', 'town', 'village', 'municipality', 'county', 'state', 'country']

/**
 * Short place name for a point, or null when Nominatim can't say. Best-effort decoration:
 * every caller must already have something to show without it.
 */
export const reverseGeocodePlaceName = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal
): Promise<string | null> => {
  try {
    const data = await nominatim.reverse(latitude, longitude, ZOOM, signal)
    const address = data.address ?? {}
    const parts = PLACE_FIELDS.map((field) => address[field]).filter(Boolean)
    if (parts.length > 0) return parts.slice(0, 2).join(', ')

    return data.display_name?.split(',').slice(0, 2).join(',').trim() || null
  } catch (error) {
    if (signal?.aborted) return null
    logger.warn('Reverse geocode failed', { error, latitude, longitude })
    return null
  }
}
