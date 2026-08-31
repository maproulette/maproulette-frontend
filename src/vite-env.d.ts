/// <reference types="vite/client" />
/// <reference types="vite-plugin-svgr/client" />

// Runtime-configurable application settings. These are baked into env.json as
// defaults at build time and may be overridden per-deployment via environment
// variables at container start (see docker/90-write-env-to-json.sh). The browser
// loads env.json into window.env before the app boots (see index.html), so app
// code reads these from window.env rather than import.meta.env. In dev and tests
// window.env is seeded from import.meta.env (see src/test/setup.ts).
interface AppEnv {
  readonly VITE_APP_NAME: string
  readonly VITE_APP_DESCRIPTION: string
  readonly VITE_API_BASE_URL: string | undefined
  readonly VITE_MAP_ROULETTE_SERVER_WEBSOCKET_URL: string
  readonly VITE_SERVER_API_KEY: string | undefined
  readonly VITE_GITHUB_ISSUES_API_OWNER: string | undefined
  readonly VITE_GITHUB_ISSUES_API_REPO: string | undefined
  readonly VITE_GITHUB_ISSUES_API_TOKEN: string | undefined
  readonly VITE_APP_URL: string | undefined
  readonly VITE_OSM_SERVER: string | undefined
  readonly VITE_OSM_API_SERVER: string | undefined
  readonly VITE_SHORT_URL: string | undefined
  readonly VITE_EMAIL_ENFORCEMENT: string | undefined
  /** Comma-separated URLs of deployment plugin bundles to auto-load at login */
  readonly VITE_DEPLOYMENT_PLUGIN_URLS: string | undefined
}

interface ImportMetaEnv extends AppEnv {}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface Window {
  env: AppEnv
}

declare const __APP_VERSION__: string
