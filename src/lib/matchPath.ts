import type { RouteParams } from '@/types/Plugin'

export interface MatchPathResult {
  matched: boolean
  params: RouteParams
}

/**
 * Matches a path against a route pattern (e.g. `/foo/:id`), extracting any
 * named params. Trailing slashes on either the pattern or the path are
 * normalized before comparison.
 */
export const matchPath = (pattern: string, path: string): MatchPathResult => {
  const normalizedPattern =
    pattern.endsWith('/') && pattern.length > 1 ? pattern.slice(0, -1) : pattern
  const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path

  if (!normalizedPattern.includes(':')) {
    return { matched: normalizedPattern === normalizedPath, params: {} }
  }

  const patternSegments = normalizedPattern.split('/').filter(Boolean)
  const pathSegments = normalizedPath.split('/').filter(Boolean)

  if (patternSegments.length !== pathSegments.length) {
    return { matched: false, params: {} }
  }

  const params: RouteParams = {}

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSegment = patternSegments[i]
    const pathSegment = pathSegments[i]

    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = pathSegment
    } else if (patternSegment !== pathSegment) {
      return { matched: false, params: {} }
    }
  }

  return { matched: true, params }
}
