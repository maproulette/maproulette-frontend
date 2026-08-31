import { IntlMessageFormat } from 'intl-messageformat'
import { defaultCatalogLoader } from './defaultCatalogLoader'
import type { Locale } from './locales'
import enUS from './messages/en-US.json'

export type MessageCatalog = Record<string, string>

export const baseCatalog: MessageCatalog = enUS as MessageCatalog

export type CatalogModule = { default: MessageCatalog }
export type CatalogLoader = (locale: Locale) => Promise<CatalogModule>

// `loadOverride` defaults to the real dynamic import and only needs to be
// supplied by tests, which can't rely on every locale in `supportedLocales`
// having a corresponding messages/*.json file on disk.
export const loadCatalog = async (
  locale: Locale,
  loadOverride: CatalogLoader = defaultCatalogLoader
): Promise<MessageCatalog> => {
  if (locale === 'en-US') return baseCatalog
  try {
    const mod = await loadOverride(locale)
    return { ...baseCatalog, ...mod.default }
  } catch {
    return baseCatalog
  }
}

export type TranslateFn = (id: string, values?: FormatValues, defaultMessage?: string) => string

export type FormatValues = Record<string, string | number>

// ICU MessageFormat parsing is not free, so compiled formatters are cached per
// (locale, template) pair rather than rebuilt on every t() call.
const formatterCache = new Map<string, IntlMessageFormat>()

// Test-only escape hatch so cache-hit/cache-miss behavior can be exercised in
// isolation without tests leaking cached formatters into one another.
export const clearFormatCache = (): void => {
  formatterCache.clear()
}

export const formatMessage = (
  locale: Locale,
  template: string,
  values: FormatValues | undefined
): string => {
  const cacheKey = `${locale} ${template}`
  let formatter = formatterCache.get(cacheKey)
  if (!formatter) {
    try {
      formatter = new IntlMessageFormat(template, locale)
    } catch {
      // Malformed ICU syntax (e.g. an unescaped brace in freeform copy) - fall
      // back to the raw template rather than crashing the render.
      return template
    }
    formatterCache.set(cacheKey, formatter)
  }
  try {
    const result = formatter.format(values)
    return Array.isArray(result) ? result.join('') : String(result)
  } catch {
    return template
  }
}
