import { describe, expect, it, vi } from 'vitest'
import type { Locale } from './locales'
import { loadCatalog } from './messageFormatting'
import enUS from './messages/en-US.json'

const baseCatalog = enUS as Record<string, string>
// A key known to exist in the real en-US catalog, used to assert base-catalog
// fallback behavior when a locale override doesn't touch it.
const [existingKey] = Object.entries(baseCatalog)[0]

describe('loadCatalog', () => {
  it('returns the base catalog directly for en-US without invoking the loader', async () => {
    const loadOverride = vi.fn()

    const result = await loadCatalog('en-US', loadOverride)

    expect(result).toBe(baseCatalog)
    expect(loadOverride).not.toHaveBeenCalled()
  })

  it('merges a locale override on top of the base catalog, override winning on conflicts', async () => {
    const loadOverride = vi.fn().mockResolvedValue({
      default: { [existingKey]: 'overridden value', 'fr.onlyKey': 'bonjour' },
    })

    const result = await loadCatalog('fr', loadOverride)

    expect(loadOverride).toHaveBeenCalledWith('fr')
    // Override wins for keys it defines.
    expect(result[existingKey]).toBe('overridden value')
    // Override-only key is present.
    expect(result['fr.onlyKey']).toBe('bonjour')
    // Base catalog fills gaps for keys the override doesn't define.
    const otherEntry = Object.entries(baseCatalog).find(([k]) => k !== existingKey)
    expect(otherEntry).toBeDefined()
    const [otherKey, otherValue] = otherEntry as [string, string]
    expect(result[otherKey]).toBe(otherValue)
  })

  it('falls back to the base catalog when the locale module fails to load', async () => {
    const loadOverride = vi.fn().mockRejectedValue(new Error('module not found'))

    const result = await loadCatalog('de', loadOverride)

    expect(result).toEqual(baseCatalog)
  })

  it('falls back to the base catalog for a completely missing locale using the real loader', async () => {
    // Translated catalogs now ship for every locale that has Transifex
    // coverage, so this needs a tag that is genuinely absent from messages/ to
    // make the default loader reject and exercise the real import() path.
    const missingLocale = 'xx-XX' as unknown as Locale

    const result = await loadCatalog(missingLocale)

    expect(result).toBe(baseCatalog)
  })

  it('merges a shipped translated catalog over the base catalog using the real loader', async () => {
    // Guards the real import() path against a locale catalog that exists but
    // is unreadable/malformed, which would silently degrade to English.
    const result = await loadCatalog('fr')

    expect(result).not.toBe(baseCatalog)
    // Every key in the source catalog still resolves, while at least one
    // differs from its English.
    expect(Object.keys(baseCatalog).every((key) => key in result)).toBe(true)
    expect(Object.entries(result).some(([k, v]) => v !== baseCatalog[k])).toBe(true)
  })
})
