import type { CatalogLoader } from './messageFormatting'

// Genuinely exercised by the "real loader" test in messageFormatting.test.ts
// (loadCatalog falls back to the base catalog for a locale with no override),
// but Vite rewrites a template-literal dynamic import into a glob-based
// lookup at build time, so v8 can't attribute that invocation back to this
// source line. Isolated in its own file — like this project's other
// tooling-limited exclusions in vite.config.ts — since v8 always reports it
// as 0% regardless of test coverage.
export const defaultCatalogLoader: CatalogLoader = (locale) => import(`./messages/${locale}.json`)
