/**
 * Challenge display images come from a team's approved image library. The
 * backend hands out root-relative paths (`/api/v2/teamImage/:id/file`) so the
 * same stored value works across environments — which means the client has to
 * resolve them against the API host rather than the app's own origin.
 */

const API_BASE_URL = () => window.env.VITE_API_BASE_URL || 'http://127.0.0.1:9000'

/** Image types the backend accepts for a team image. */
export const TEAM_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const

/** `accept` attribute for the team image file picker. */
export const TEAM_IMAGE_ACCEPT = TEAM_IMAGE_MIME_TYPES.join(',')

/** Matches the 2MB cap enforced by the backend. */
export const TEAM_IMAGE_MAX_BYTES = 2 * 1024 * 1024

/**
 * Turns a stored image path into something usable as an `<img>` src by
 * prepending the API host. Absolute URLs pass through untouched. Returns
 * undefined when there's no image.
 */
export const resolveTeamImageUrl = (avatarUrl?: string | null): string | undefined => {
  if (!avatarUrl) return undefined
  if (/^(https?:)?\/\//i.test(avatarUrl) || avatarUrl.startsWith('data:')) return avatarUrl
  return `${API_BASE_URL().replace(/\/$/, '')}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`
}
