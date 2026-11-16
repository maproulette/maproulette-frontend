/**
 * Utilities for constructing Rapid editor URLs and handling editor functionality
 */

/**
 * Get OSM token from local storage
 */
export const getOSMToken = (): string | null => {
  return localStorage.getItem('osm_token') || null
}
