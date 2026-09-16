import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { usePluginContext } from '@/contexts/PluginContext'
import { navigation } from '@/data/site.json'
import { docsUrl } from '@/lib/documentationLinks'
import type { PluginNavigationItem } from '@/types/Plugin'

/**
 * The app chrome — everything the shell renders *about* the current page rather
 * than the page itself: its title, its breadcrumb trail, the actions that sit in
 * the section header, and the navigation items in the main nav.
 *
 * These were four separate contexts. They're one provider now because they're
 * one concern: when the header is wrong, there's a single place to look.
 */

export interface BreadcrumbSegment {
  label: string
  href: string
}

interface ChromeState {
  title: string | null
  breadcrumbs: BreadcrumbSegment[] | null
  actions: ReactNode | null
}

interface ChromeDispatch {
  setTitle: (title: string | null) => void
  setBreadcrumbs: (breadcrumbs: BreadcrumbSegment[] | null) => void
  setActions: (actions: ReactNode | null) => void
}

const ChromeStateContext = createContext<ChromeState>({
  title: null,
  breadcrumbs: null,
  actions: null,
})

// Reason: split from the state so the page-level setter hooks below subscribe to
// something whose identity never changes — a page that only *sets* chrome must
// not re-render every time some other page's title lands.
const ChromeDispatchContext = createContext<ChromeDispatch>({
  setTitle: () => {},
  setBreadcrumbs: () => {},
  setActions: () => {},
})

// Reason: navigation is derived from site.json + plugins and changes only when a
// plugin registers. Kept off the state context so the nav doesn't re-render on
// every title change.
const ChromeNavigationContext = createContext<{ navigationItems: PluginNavigationItem[] }>({
  navigationItems: [],
})

// site.json stands in for the docs URL with this token rather than hardcoding
// a host, since the docs site is configured per deployment.
const DOCS_NAV_PLACEHOLDER = 'docs:'

export const ChromeProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbSegment[] | null>(null)
  const [actions, setActions] = useState<ReactNode | null>(null)

  const { main: mainNavigation } = navigation
  const { navigationItems: pluginNavigationItems } = usePluginContext()

  const state = useMemo(() => ({ title, breadcrumbs, actions }), [title, breadcrumbs, actions])

  // Reason: useState setters are referentially stable, so this value is built
  // once and never invalidates its consumers.
  const dispatch = useMemo(() => ({ setTitle, setBreadcrumbs, setActions }), [])

  const navigationItems: PluginNavigationItem[] = useMemo(
    () => [
      ...mainNavigation.map((item) => ({
        ...item,
        // The docs site's host is deployment-configurable, so site.json marks
        // its entry with a placeholder that's resolved here (see lib/documentationLinks.ts).
        to: item.to === DOCS_NAV_PLACEHOLDER ? docsUrl() : item.to,
        id: item.to,
        icon: undefined,
      })),
      ...pluginNavigationItems,
    ],
    [mainNavigation, pluginNavigationItems]
  )

  const navigationValue = useMemo(() => ({ navigationItems }), [navigationItems])

  return (
    <ChromeDispatchContext.Provider value={dispatch}>
      <ChromeNavigationContext.Provider value={navigationValue}>
        <ChromeStateContext.Provider value={state}>{children}</ChromeStateContext.Provider>
      </ChromeNavigationContext.Provider>
    </ChromeDispatchContext.Provider>
  )
}

/** Reads the chrome the current page has published. For the section header. */
export const useChrome = () => useContext(ChromeStateContext)

/** Reads the main navigation items, static and plugin-contributed. */
export const useChromeNavigation = () => useContext(ChromeNavigationContext)

/** Publishes a title for the current page, clearing it on the way out. */
export const useSetPageTitle = (title: string | null) => {
  const { setTitle } = useContext(ChromeDispatchContext)

  useEffect(() => {
    setTitle(title)
    return () => setTitle(null)
  }, [title, setTitle])
}

/** Overrides the derived breadcrumb trail for the current page. */
export const useSetBreadcrumbs = (breadcrumbs: BreadcrumbSegment[] | null) => {
  const { setBreadcrumbs } = useContext(ChromeDispatchContext)
  const breadcrumbsRef = useRef(breadcrumbs)
  breadcrumbsRef.current = breadcrumbs

  // Reason: callers build this array inline, so it's a new identity every render.
  // Serializing is what lets the effect re-run on real changes without looping.
  const serialized = JSON.stringify(breadcrumbs)
  useEffect(() => {
    setBreadcrumbs(breadcrumbsRef.current)
    return () => setBreadcrumbs(null)
  }, [serialized, setBreadcrumbs])
}

/** Publishes section-header actions for the current page. */
export const useSetHeaderActions = (actions: ReactNode | null) => {
  const { setActions } = useContext(ChromeDispatchContext)
  const actionsRef = useRef(actions)
  actionsRef.current = actions

  // Reason: a ReactNode is a fresh object every render and can't be compared, so
  // this publishes once on mount. Call sites render static controls; anything
  // that needs to change while mounted needs a different signal than identity.
  useEffect(() => {
    setActions(actionsRef.current)
    return () => setActions(null)
  }, [setActions])
}
