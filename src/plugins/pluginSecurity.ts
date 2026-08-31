import { pluginLogger } from '@/lib/logger'

/**
 * Allowed plugin hosts for security
 * Only plugins from these hosts can be loaded dynamically
 */
const ALLOWED_PLUGIN_HOSTS = [
  'maproulette.org',
  'www.maproulette.org',
  'cdn.maproulette.org',
  'github.com',
  'raw.githubusercontent.com',
  'gist.githubusercontent.com',
  'unpkg.com', // NPM CDN
  'cdn.jsdelivr.net', // NPM CDN
  // Development
  ...(import.meta.env.DEV ? ['localhost', '127.0.0.1'] : []),
]

/**
 * The origin the app itself is served from, or undefined outside a browser (the
 * node test environment defines `window` as a bare shim with no location).
 */
const appOrigin = (): string | undefined =>
  typeof window !== 'undefined' ? window.location?.origin : undefined

/**
 * Parses a plugin URL the same way {@link validatePluginUrl} does, so a URL that
 * passed validation is guaranteed to parse for callers too. Absolute URLs parse
 * as-is; root-relative paths (`/plugins/foo.js` - the same-origin bundles the app
 * serves itself) resolve against the app origin. Anything else is rejected rather
 * than silently absorbed as a relative path, which is what `new URL(url, origin)`
 * would otherwise do to malformed input.
 *
 * @param url - The URL to parse
 * @returns The parsed URL, or null if it is not a usable plugin URL
 */
export const parsePluginUrl = (url: string): URL | null => {
  try {
    if (url.startsWith('/')) {
      const origin = appOrigin()
      return origin === undefined ? null : new URL(url, origin)
    }
    return new URL(url)
  } catch {
    return null
  }
}

/**
 * Validates a plugin URL against the security allowlist
 *
 * @param url - The URL to validate
 * @returns true if the URL is allowed, false otherwise
 *
 * @example
 * ```ts
 * validatePluginUrl('https://cdn.maproulette.org/plugins/editor.js') // true
 * validatePluginUrl('https://evil.com/malware.js') // false
 * ```
 */
export const validatePluginUrl = (url: string): boolean => {
  const parsed = parsePluginUrl(url)
  if (!parsed) {
    pluginLogger.error('Invalid plugin URL', { url })
    return false
  }

  // Same-origin bundles (e.g. /plugins/... served as static files) are always allowed.
  if (parsed.origin === appOrigin()) {
    pluginLogger.debug('Plugin URL validated (same-origin)', { url })
    return true
  }

  // Only allow HTTPS (or HTTP in development for localhost)
  if (parsed.protocol !== 'https:') {
    if (import.meta.env.DEV && parsed.protocol === 'http:') {
      // Allow HTTP for localhost in development
      if (!['localhost', '127.0.0.1'].includes(parsed.hostname)) {
        pluginLogger.error('Plugin URL must use HTTPS', { url })
        return false
      }
    } else {
      pluginLogger.error('Plugin URL must use HTTPS', { url })
      return false
    }
  }

  // Check if hostname is in allowlist
  const isAllowed = ALLOWED_PLUGIN_HOSTS.some((allowedHost) => {
    // Exact match
    if (parsed.hostname === allowedHost) {
      return true
    }
    // Subdomain match (e.g., plugins.maproulette.org matches maproulette.org)
    if (parsed.hostname.endsWith(`.${allowedHost}`)) {
      return true
    }
    return false
  })

  if (!isAllowed) {
    pluginLogger.error('Plugin URL host not in allowlist', {
      url,
      hostname: parsed.hostname,
      allowedHosts: ALLOWED_PLUGIN_HOSTS,
    })
    return false
  }

  pluginLogger.debug('Plugin URL validated', { url, hostname: parsed.hostname })
  return true
}

/**
 * Validates multiple plugin URLs
 *
 * @param urls - Array of URLs to validate
 * @returns Object with valid and invalid URLs
 */
export const validatePluginUrls = (
  urls: string[]
): {
  valid: string[]
  invalid: string[]
} => {
  const valid: string[] = []
  const invalid: string[] = []

  for (const url of urls) {
    if (validatePluginUrl(url)) {
      valid.push(url)
    } else {
      invalid.push(url)
    }
  }

  if (invalid.length > 0) {
    pluginLogger.warn('Some plugin URLs failed validation', {
      invalidCount: invalid.length,
      invalidUrls: invalid,
    })
  }

  return { valid, invalid }
}

/**
 * Get the list of allowed plugin hosts
 * Useful for displaying to users
 */
export const getAllowedPluginHosts = (): readonly string[] => {
  return ALLOWED_PLUGIN_HOSTS
}
