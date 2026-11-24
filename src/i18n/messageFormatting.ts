import enUS from '../../lang/en-US.json'
import { defaultCatalogLoader } from './defaultCatalogLoader'
import type { Locale } from './locales'

export type MessageCatalog = Record<string, string>

// The files in lang/ are Transifex Structured JSON, which wraps each message in
// an object alongside metadata like `developer_comment`.
export type StructuredCatalog = Record<string, { string: string }>

const flattenCatalog = (catalog: StructuredCatalog): MessageCatalog =>
  Object.fromEntries(Object.entries(catalog).map(([id, entry]) => [id, entry.string]))

export const baseCatalog = flattenCatalog(enUS)

type CatalogModule = { default: StructuredCatalog }
export type CatalogLoader = (locale: Locale) => Promise<CatalogModule>

// `loadOverride` defaults to the real dynamic import and only needs to be
// supplied by tests, which can't rely on every locale in `supportedLocales`
// having a corresponding lang/*.json file on disk.
export const loadCatalog = async (
  locale: Locale,
  loadOverride: CatalogLoader = defaultCatalogLoader
): Promise<MessageCatalog> => {
  if (locale === 'en-US') return baseCatalog
  try {
    const mod = await loadOverride(locale)
    return { ...baseCatalog, ...flattenCatalog(mod.default) }
  } catch {
    return baseCatalog
  }
}
