/**
 * @vitest-environment happy-dom
 */
import { createElement, type ReactNode, useRef } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderHook } from '@/test/renderHook'

// ChromeProvider derives its navigation from the plugin registry, whose real
// provider fetches and registers plugins. Only the navigation items matter here.
const pluginNavigationItems = vi.hoisted(() => ({ current: [] as { id: string; to: string }[] }))
vi.mock('@/contexts/PluginContext', () => ({
  usePluginContext: () => ({ navigationItems: pluginNavigationItems.current }),
}))

const {
  ChromeProvider,
  useChrome,
  useChromeNavigation,
  useSetBreadcrumbs,
  useSetHeaderActions,
  useSetPageTitle,
} = await import('./ChromeContext')

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(ChromeProvider, null, children)

/** Renders a publisher and a reader under one provider, so we can watch what lands. */
const renderChrome = <T,>(publish: (props: T) => void, initialProps: T) =>
  renderHook(
    (props: T) => {
      publish(props)
      return useChrome()
    },
    { initialProps, wrapper }
  )

describe('useSetPageTitle', () => {
  it('publishes the title and clears it on unmount', () => {
    const { result, unmount } = renderChrome(
      (title: string | null) => useSetPageTitle(title),
      'Roads'
    )
    expect(result.current.title).toBe('Roads')

    // The reader unmounts alongside the publisher, so re-read through a fresh
    // one to confirm the provider itself was reset.
    unmount()
    const { result: after } = renderHook(() => useChrome(), { wrapper })
    expect(after.current.title).toBeNull()
  })

  it('republishes when the title changes', () => {
    const { result, rerender } = renderChrome<string | null>(
      (title) => useSetPageTitle(title),
      'Roads'
    )
    rerender('Buildings')
    expect(result.current.title).toBe('Buildings')
  })
})

describe('useSetBreadcrumbs', () => {
  it('republishes when the segments change in content but not identity', () => {
    const { result, rerender } = renderChrome<{ label: string; href: string }[]>(
      (segments) => useSetBreadcrumbs(segments),
      [{ label: 'manage', href: '/manage' }]
    )
    expect(result.current.breadcrumbs).toEqual([{ label: 'manage', href: '/manage' }])

    // A fresh array with the same contents must not cause a republish loop, and
    // a genuinely different trail must land.
    rerender([{ label: 'manage', href: '/manage' }])
    expect(result.current.breadcrumbs).toEqual([{ label: 'manage', href: '/manage' }])

    rerender([
      { label: 'manage', href: '/manage' },
      { label: 'challenges', href: '/manage/challenges' },
    ])
    expect(result.current.breadcrumbs).toHaveLength(2)
  })

  it('clears the override on unmount so the next page derives its own trail', () => {
    const { unmount } = renderChrome<{ label: string; href: string }[]>(
      (segments) => useSetBreadcrumbs(segments),
      [{ label: 'manage', href: '/manage' }]
    )
    unmount()
    const { result } = renderHook(() => useChrome(), { wrapper })
    expect(result.current.breadcrumbs).toBeNull()
  })
})

describe('useSetHeaderActions', () => {
  it('publishes actions and clears them on unmount', () => {
    const actions = createElement('button', { type: 'button' }, 'Create Challenge')
    const { result, unmount } = renderChrome<ReactNode>(
      (node) => useSetHeaderActions(node),
      actions as ReactNode
    )
    expect(result.current.actions).toBe(actions)

    unmount()
    const { result: after } = renderHook(() => useChrome(), { wrapper })
    expect(after.current.actions).toBeNull()
  })
})

describe('useChromeNavigation', () => {
  it('resolves the docs placeholder and appends plugin items', () => {
    pluginNavigationItems.current = [{ id: 'plugin-nav', to: '/plugin' }]
    const { result } = renderHook(() => useChromeNavigation(), { wrapper })
    const items = result.current.navigationItems

    expect(items.find((item) => item.label === 'Learn')?.to).toMatch(/^https?:\/\/.+\/$/)
    expect(items.some((item) => item.to === 'docs:')).toBe(false)
    expect(items.at(-1)).toMatchObject({ id: 'plugin-nav', to: '/plugin' })
    pluginNavigationItems.current = []
  })
})

describe('chrome render isolation', () => {
  it('keeps the navigation value stable while chrome state changes', () => {
    // The nav must not re-render every time a page publishes a title — that
    // isolation is why navigation is its own context rather than a field on the
    // state value. Value identity is what React re-renders consumers on, so
    // that is what this pins.
    const renders = { count: 0 }
    const { rerender } = renderHook(
      (title: string) => {
        useSetPageTitle(title)
        const seen = useRef<unknown>(null)
        const next = useChromeNavigation()
        if (seen.current !== next) {
          seen.current = next
          renders.count += 1
        }
      },
      { initialProps: 'Roads', wrapper }
    )

    const afterMount = renders.count
    rerender('Buildings')
    expect(renders.count).toBe(afterMount)
  })
})
