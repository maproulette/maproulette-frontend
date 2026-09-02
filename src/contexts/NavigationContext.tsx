import { createContext, useContext, useMemo } from 'react'
import { usePluginContext } from '@/contexts/PluginContext'
import { navigation } from '@/data/site.json'
import { docsUrl } from '@/lib/docs'
import type { PluginNavigationItem } from '@/types/Plugin'

// site.json stands in for the docs URL with this token rather than hardcoding
// a host, since the docs site is configured per deployment.
const DOCS_NAV_PLACEHOLDER = 'docs:'

interface NavigationContextType {
  allNavigationItems: PluginNavigationItem[]
}

const NavigationContext = createContext<NavigationContextType>({
  allNavigationItems: [],
})

export const NavigationProvider = ({ children }: { children: React.ReactNode }) => {
  const { main: mainNavigation } = navigation
  const { navigationItems: pluginNavigationItems } = usePluginContext()

  // Reason: combines static + plugin navigation, used as context value dependency
  const allNavigationItems: PluginNavigationItem[] = useMemo(
    () => [
      ...mainNavigation.map((item) => ({
        ...item,
        // The docs site's host is deployment-configurable, so site.json marks
        // its entry with a placeholder that's resolved here (see lib/docs.ts).
        to: item.to === DOCS_NAV_PLACEHOLDER ? docsUrl() : item.to,
        id: item.to,
        icon: undefined,
      })),
      ...pluginNavigationItems,
    ],
    [mainNavigation, pluginNavigationItems]
  )

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo(() => ({ allNavigationItems }), [allNavigationItems])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export const useNavigationContext = () => useContext(NavigationContext)
