import { defaultCatalogLoader } from './defaultCatalogLoader'
import type { Locale } from './locales'
import enUS from './messages/en-US.json'

export type MessageCatalog = Record<string, string>

export const baseCatalog: MessageCatalog = enUS as MessageCatalog

type CatalogModule = { default: MessageCatalog }
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
