import { beforeEach, describe, expect, it, vi } from 'vitest'
import enUS from './messages/en-US.json'

vi.mock('intl-messageformat', async () => {
  const actual = await vi.importActual<typeof import('intl-messageformat')>('intl-messageformat')
  return {
    ...actual,
    IntlMessageFormat: vi.fn(function (this: unknown, ...args: unknown[]) {
      return new actual.IntlMessageFormat(
        ...(args as ConstructorParameters<typeof actual.IntlMessageFormat>)
      )
    }),
  }
})

import { IntlMessageFormat } from 'intl-messageformat'
import type { Locale } from './locales'
import { clearFormatCache, formatMessage, loadCatalog } from './messageFormatting'

const baseCatalog = enUS as Record<string, string>
// A key known to exist in the real en-US catalog, used to assert base-catalog
// fallback behavior when a locale override doesn't touch it.
const [existingKey] = Object.entries(baseCatalog)[0]

describe('formatMessage', () => {
  beforeEach(() => {
    clearFormatCache()
    vi.mocked(IntlMessageFormat).mockClear()
  })

  it('compiles and formats a simple template on cache miss', () => {
    const result = formatMessage('en-US', 'Hello {name}', { name: 'World' })

    expect(result).toBe('Hello World')
    expect(IntlMessageFormat).toHaveBeenCalledTimes(1)
  })

  it('joins an array result into a single string, e.g. for a rich-text tag template', () => {
    // ICU tag placeholders (e.g. <b>...</b>) only make IntlMessageFormat#format
    // return an array of parts (instead of a plain string) when the tag's
    // value function returns a non-primitive (e.g. a React element in a real
    // rich-text caller); formatMessage must flatten that back to a string.
    const values = {
      name: 'World',
      b: (chunks: unknown[]) => ({ tag: 'b', children: chunks }),
    } as unknown as Parameters<typeof formatMessage>[2]

    const result = formatMessage('en-US', 'Hello <b>{name}</b>!', values)

    expect(result).toBe('Hello [object Object]!')
  })

  it('reuses the cached formatter on a subsequent call with the same locale+template', () => {
    const first = formatMessage('en-US', 'Hello {name}', { name: 'World' })
    expect(IntlMessageFormat).toHaveBeenCalledTimes(1)

    const second = formatMessage('en-US', 'Hello {name}', { name: 'Universe' })

    expect(second).toBe('Hello Universe')
    expect(first).toBe('Hello World')
    // Same template+locale should not trigger a second ICU compile.
    expect(IntlMessageFormat).toHaveBeenCalledTimes(1)
  })

  it('recompiles when the template differs for the same locale', () => {
    formatMessage('en-US', 'Hello {name}', { name: 'World' })
    formatMessage('en-US', 'Goodbye {name}', { name: 'World' })

    expect(IntlMessageFormat).toHaveBeenCalledTimes(2)
  })

  it('recompiles when the locale differs for the same template', () => {
    formatMessage('en-US', 'Hello {name}', { name: 'World' })
    formatMessage('fr', 'Hello {name}', { name: 'World' })

    expect(IntlMessageFormat).toHaveBeenCalledTimes(2)
  })

  it('falls back to the raw template when the ICU syntax is malformed', () => {
    const malformed = 'Unmatched brace {name'

    const result = formatMessage('en-US', malformed, { name: 'World' })

    expect(result).toBe(malformed)
  })

  it('falls back to the raw template when formatting throws (e.g. missing values)', () => {
    // Valid ICU syntax, but no `count` value supplied -> compiles fine but
    // throws during format().
    const template = '{count, plural, one {# match} other {# matches}}'

    const result = formatMessage('en-US', template, undefined)

    expect(result).toBe(template)
  })
})

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
    // Carried-over French translations are a subset of the source catalog, so
    // every key still resolves while at least one differs from its English.
    expect(Object.keys(result).length).toBe(Object.keys(baseCatalog).length)
    expect(Object.entries(result).some(([k, v]) => v !== baseCatalog[k])).toBe(true)
  })
})
