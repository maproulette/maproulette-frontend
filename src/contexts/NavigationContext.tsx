import { createContext, useContext, useMemo } from 'react'
import { usePluginContext } from '@/contexts/PluginContext'
import { navigation } from '@/data/site.json'
import type { PluginNavigationItem } from '@/types/Plugin'

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
      ...mainNavigation.map((item) => ({ ...item, id: item.to, icon: undefined })),
      ...pluginNavigationItems,
    ],
    [mainNavigation, pluginNavigationItems]
  )

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo(() => ({ allNavigationItems }), [allNavigationItems])

  return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>
}

export const useNavigationContext = () => useContext(NavigationContext)
