// In the browser, index.html loads env.json into window.env before the app
// boots. Tests have no env.json, so seed window.env from Vite's import.meta.env
// (populated from .env.test). The node environment used by *.test.ts has no
// window or location, so define them first.
globalThis.window ??= globalThis as Window & typeof globalThis
;(globalThis as { location?: Location }).location ??= new URL(
  'https://maproulette.test/'
) as unknown as Location
window.env = { ...import.meta.env } as AppEnv

// The node environment used by *.test.ts predates Node's global File (added in
// Node 20); pull it in from node:buffer so File-based tests can run on Node 18.
if (typeof globalThis.File === 'undefined') {
  const { File } = await import('node:buffer')
  globalThis.File = File as unknown as typeof globalThis.File
}
// React's `act` (used by src/test/renderHook.ts) refuses to run without this
// flag — normally set by a testing-library setup, but we don't depend on one.
;(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
