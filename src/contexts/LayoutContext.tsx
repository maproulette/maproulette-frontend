import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'

// Matches Tailwind's `md` breakpoint. The panel/map layout differs enough
// between desktop (resizable side-by-side) and mobile (stacked, toggled) that
// picking one via JS avoids mounting both — a live maplibre-gl map plus its
// Supercluster indices are too expensive to keep duplicated in a hidden tree.
const DESKTOP_QUERY = '(min-width: 768px)'

const LayoutContext = createContext<boolean | undefined>(undefined)

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia(DESKTOP_QUERY)
    const handleChange = () => setIsDesktop(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return <LayoutContext.Provider value={isDesktop}>{children}</LayoutContext.Provider>
}

export const useIsDesktopLayoutContext = () => {
  const isDesktop = useContext(LayoutContext)
  if (isDesktop === undefined) {
    throw new Error('useIsDesktopLayoutContext must be used within a LayoutProvider')
  }
  return isDesktop
}
