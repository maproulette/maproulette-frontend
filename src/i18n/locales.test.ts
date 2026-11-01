import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  defaultLocale,
  isSupportedLocale,
  normalizeLocale,
  resolveInitialLocale,
} from './locales.ts'

describe('isSupportedLocale', () => {
  it.each([
    ['en-US', true],
    ['xx-XX', false],
    [null, false],
    [undefined, false],
    ['', false],
  ] as const)('given locale %s, returns %s', (locale, expected) => {
    expect(isSupportedLocale(locale)).toBe(expected)
  })
})

describe('normalizeLocale', () => {
  it.each([
    ['fr', 'fr'],
    ['pt-BR', 'pt-BR'],
    ['en', 'en-US'],
    ['xx-XX', undefined],
    ['', undefined],
    [null, undefined],
    [undefined, undefined],
  ] as const)('given locale %s, returns %s', (locale, expected) => {
    expect(normalizeLocale(locale)).toBe(expected)
  })
})

describe('resolveInitialLocale', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns the preferred locale when it is supported', () => {
    expect(resolveInitialLocale('fr')).toBe('fr')
  })

  it('falls back to the default locale when navigator is unavailable', () => {
    vi.stubGlobal('navigator', undefined)

    expect(resolveInitialLocale('xx-XX')).toBe(defaultLocale)
  })

  it('uses navigator.language when it is directly supported', () => {
    vi.stubGlobal('navigator', { language: 'de', languages: ['de'] })

    expect(resolveInitialLocale()).toBe('de')
  })

  it('falls back to navigator.languages when navigator.language is unsupported', () => {
    vi.stubGlobal('navigator', { language: 'xx-XX', languages: ['ja'] })

    expect(resolveInitialLocale(null)).toBe('ja')
  })

  it('matches on a shared language prefix when no exact match exists', () => {
    vi.stubGlobal('navigator', { language: 'pt', languages: [] })

    expect(resolveInitialLocale()).toBe('pt-BR')
  })

  it('handles navigator.languages being undefined', () => {
    vi.stubGlobal('navigator', { language: 'es', languages: undefined })

    expect(resolveInitialLocale()).toBe('es')
  })

  it('falls back to the default locale when nothing matches', () => {
    vi.stubGlobal('navigator', { language: 'xx-XX', languages: ['yy-YY'] })

    expect(resolveInitialLocale()).toBe(defaultLocale)
  })
})
