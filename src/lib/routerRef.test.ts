// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

type RouterRefModule = typeof import('./routerRef')

let routerRef: RouterRefModule
let navigate: ReturnType<typeof vi.fn<(options: Record<string, unknown>) => unknown>>

beforeEach(async () => {
  // routerRef holds the router in module state; reload it so each test starts
  // with no router registered.
  vi.resetModules()
  routerRef = await import('./routerRef')
  navigate = vi.fn()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('setAppRouter / getAppRouter', () => {
  it('has no router until one is registered', () => {
    expect(routerRef.getAppRouter()).toBeNull()
  })

  it('hands back the registered router', () => {
    const router = { navigate }
    routerRef.setAppRouter(router)
    expect(routerRef.getAppRouter()).toBe(router)
  })
})

describe('navigateInApp', () => {
  it('falls back to a full page load before the router is registered', () => {
    const assign = vi.spyOn(window.location, 'assign').mockImplementation(() => {})
    routerRef.navigateInApp('/tasks/42')
    expect(assign).toHaveBeenCalledWith('/tasks/42')
    expect(navigate).not.toHaveBeenCalled()
  })

  it('routes a task url through the typed task route', () => {
    routerRef.setAppRouter({ navigate })
    routerRef.navigateInApp('/tasks/42')
    expect(navigate).toHaveBeenCalledWith({
      to: '/tasks/$taskId',
      params: { taskId: '42' },
      search: {},
    })
  })

  it('tolerates a trailing slash on a task url', () => {
    routerRef.setAppRouter({ navigate })
    routerRef.navigateInApp('/tasks/42/')
    expect(navigate).toHaveBeenCalledWith(expect.objectContaining({ params: { taskId: '42' } }))
  })

  it('coerces boolean-ish search params so typed routes get real booleans', () => {
    routerRef.setAppRouter({ navigate })
    routerRef.navigateInApp('/tasks/42?claimTask=true&review=1&skip=false&done=0&from=inbox')
    expect(navigate).toHaveBeenCalledWith(
      expect.objectContaining({
        search: { claimTask: true, review: true, skip: false, done: false, from: 'inbox' },
      })
    )
  })

  it('routes an unknown single-segment path to the plugin splat route', () => {
    routerRef.setAppRouter({ navigate })
    routerRef.navigateInApp('/my-plugin?tab=stats')
    expect(navigate).toHaveBeenCalledWith({
      to: '/$',
      params: { _splat: 'my-plugin' },
      search: { tab: 'stats' },
    })
  })

  it('does not send a core app path to the plugin splat route', () => {
    routerRef.setAppRouter({ navigate })
    routerRef.navigateInApp('/teams')
    expect(navigate).toHaveBeenCalledWith({ href: '/teams' })
  })

  it('navigates by href for anything deeper than one segment', () => {
    routerRef.setAppRouter({ navigate })
    routerRef.navigateInApp('/challenge/7/leaderboard?page=2')
    expect(navigate).toHaveBeenCalledWith({ href: '/challenge/7/leaderboard?page=2' })
  })
})
