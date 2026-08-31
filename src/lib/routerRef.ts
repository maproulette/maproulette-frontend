import { isCoreAppPath } from '@/lib/pluginRoutes'

interface AppRouter {
  navigate: (options: Record<string, unknown>) => unknown
}

let routerInstance: AppRouter | null = null

export const setAppRouter = (router: AppRouter): void => {
  routerInstance = router
}

export const getAppRouter = (): AppRouter | null => routerInstance

const parseSearchParams = (url: URL): Record<string, string | boolean | undefined> => {
  const search: Record<string, string | boolean | undefined> = {}

  for (const [key, value] of url.searchParams.entries()) {
    if (value === 'true' || value === '1') {
      search[key] = true
      continue
    }
    if (value === 'false' || value === '0') {
      search[key] = false
      continue
    }
    search[key] = value
  }

  return search
}

export const navigateInApp = (path: string): void => {
  if (!routerInstance) {
    window.location.assign(path)
    return
  }

  const url = new URL(path, window.location.origin)
  const search = parseSearchParams(url)

  const taskMatch = url.pathname.match(/^\/tasks\/(\d+)\/?$/)
  if (taskMatch) {
    void routerInstance.navigate({
      to: '/tasks/$taskId',
      params: { taskId: taskMatch[1] },
      search,
    })
    return
  }

  const splatMatch = url.pathname.match(/^\/([^/]+)\/?$/)
  if (splatMatch && !isCoreAppPath(url.pathname)) {
    void routerInstance.navigate({
      to: '/$',
      params: { _splat: splatMatch[1] },
      search,
    })
    return
  }

  void routerInstance.navigate({ href: `${url.pathname}${url.search}` })
}
