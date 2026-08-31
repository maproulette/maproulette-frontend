/** First-class app routes — never show plugin catch-all 404 for these paths. */
const CORE_APP_PATH =
  /^\/(tasks|challenge|project|manage|teams|profile|dashboard|settings|notifications|super-admin)(\/|$)/

export const isCoreAppPath = (pathname: string): boolean =>
  pathname === '/' || CORE_APP_PATH.test(pathname)
