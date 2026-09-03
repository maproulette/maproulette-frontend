import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  getAllowedPluginHosts,
  parsePluginUrl,
  validatePluginUrl,
  validatePluginUrls,
} from './pluginSecurity'

// import.meta.env.DEV defaults to true under vitest, so the module-level
// ALLOWED_PLUGIN_HOSTS list (built at import time) includes localhost/127.0.0.1
// unless a test explicitly stubs DEV to false and re-imports the module fresh.
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('validatePluginUrl (DEV mode)', () => {
  it.each([
    [
      'allows an https URL on an exactly-matched allowed host',
      'https://github.com/org/repo/plugin.js',
      true,
    ],
    [
      'allows an https URL on a subdomain of an allowed host',
      'https://cdn.maproulette.org/plugin.js',
      true,
    ],
    ['rejects an https URL on a host not in the allowlist', 'https://evil.com/plugin.js', false],
    ['allows http on localhost since DEV is enabled', 'http://localhost:3000/plugin.js', true],
    ['allows http on 127.0.0.1 since DEV is enabled', 'http://127.0.0.1:3000/plugin.js', true],
    [
      'rejects http on a non-localhost host even in DEV mode',
      'http://example.com/plugin.js',
      false,
    ],
    ['rejects a non-http(s) protocol', 'ftp://github.com/plugin.js', false],
    ['rejects a malformed URL', 'not a valid url', false],
  ] as const)('%s', (_label, url, expected) => {
    expect(validatePluginUrl(url)).toBe(expected)
  })
})

describe('validatePluginUrl (production mode)', () => {
  it('excludes localhost from the allowlist and rejects http entirely', async () => {
    vi.stubEnv('DEV', false)
    vi.resetModules()
    const mod = await import('./pluginSecurity')

    expect(mod.validatePluginUrl('http://localhost:3000/plugin.js')).toBe(false)
    expect(mod.getAllowedPluginHosts()).not.toContain('localhost')
    expect(mod.getAllowedPluginHosts()).not.toContain('127.0.0.1')
  })

  it('still allows https URLs on allowed hosts', async () => {
    vi.stubEnv('DEV', false)
    vi.resetModules()
    const mod = await import('./pluginSecurity')

    expect(mod.validatePluginUrl('https://unpkg.com/plugin.js')).toBe(true)
  })
})

describe('validatePluginUrls', () => {
  it('splits URLs into valid and invalid buckets', () => {
    const result = validatePluginUrls([
      'https://github.com/plugin.js',
      'https://evil.com/plugin.js',
      'https://cdn.jsdelivr.net/plugin.js',
    ])

    expect(result.valid).toEqual([
      'https://github.com/plugin.js',
      'https://cdn.jsdelivr.net/plugin.js',
    ])
    expect(result.invalid).toEqual(['https://evil.com/plugin.js'])
  })

  it('returns an empty invalid array when every URL is valid', () => {
    const result = validatePluginUrls(['https://github.com/plugin.js'])

    expect(result.valid).toEqual(['https://github.com/plugin.js'])
    expect(result.invalid).toEqual([])
  })

  it('returns an empty valid array when every URL is invalid', () => {
    const result = validatePluginUrls(['https://evil.com/plugin.js'])

    expect(result.valid).toEqual([])
    expect(result.invalid).toEqual(['https://evil.com/plugin.js'])
  })

  it('handles an empty input array', () => {
    expect(validatePluginUrls([])).toEqual({ valid: [], invalid: [] })
  })
})

describe('getAllowedPluginHosts', () => {
  it('returns the list of allowed hosts including dev-only hosts', () => {
    const hosts = getAllowedPluginHosts()
    expect(hosts).toContain('maproulette.org')
    expect(hosts).toContain('localhost')
  })
})

// The node test environment shims `window` as a bare global with no location, so
// same-origin handling is only reachable with an origin stubbed in.
describe('validatePluginUrl (same-origin bundles)', () => {
  it('allows a root-relative bundle path once the app origin is known', () => {
    vi.stubGlobal('location', { origin: 'https://mr.example.org' })

    expect(validatePluginUrl('/plugins/review.js')).toBe(true)
  })

  it("allows an absolute URL on the app's own origin even though it is not allowlisted", () => {
    vi.stubGlobal('location', { origin: 'https://mr.example.org' })

    expect(validatePluginUrl('https://mr.example.org/plugins/review.js')).toBe(true)
  })

  it('rejects a root-relative path when there is no app origin to resolve it against', () => {
    expect(validatePluginUrl('/plugins/review.js')).toBe(false)
  })

  it('rejects a root-relative path outside a browser altogether', () => {
    vi.stubGlobal('window', undefined)

    expect(validatePluginUrl('/plugins/review.js')).toBe(false)
  })
})

describe('parsePluginUrl', () => {
  it('parses an absolute URL as-is', () => {
    expect(parsePluginUrl('https://cdn.maproulette.org/plugin.js')?.href).toBe(
      'https://cdn.maproulette.org/plugin.js'
    )
  })

  it('resolves a root-relative path against the app origin', () => {
    vi.stubGlobal('location', { origin: 'https://mr.example.org' })

    expect(parsePluginUrl('/plugins/review.js')?.href).toBe(
      'https://mr.example.org/plugins/review.js'
    )
  })

  it('returns null for a root-relative path with no app origin', () => {
    expect(parsePluginUrl('/plugins/review.js')).toBeNull()
  })

  it('returns null for junk rather than absorbing it as a relative path', () => {
    vi.stubGlobal('location', { origin: 'https://mr.example.org' })

    expect(parsePluginUrl('not a valid url')).toBeNull()
  })
})
