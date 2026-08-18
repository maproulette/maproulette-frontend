import { useEffect, useMemo, useRef, useState } from 'react'
import { DrawerPortalTarget } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable'
import { BrowseChallengeMap } from './BrowseChallengeMap'
import { ChallengePanel } from './ChallengePanel'
import { ChallengeFooter } from './ChallengePanel/ChallengeFooter'
import { ChallengeModals } from './ChallengePanel/ChallengeModals'
import { ChallengeModalsProvider } from './ChallengePanel/ChallengeModals/ChallengeModalsContext'
import { MapToggleContext } from './MapToggleContext'

// Matches Tailwind's `md` breakpoint. The panel/map layout differs enough
// between desktop (resizable side-by-side) and mobile (stacked, toggled) that
// picking one via JS avoids mounting both — a live maplibre-gl map plus its
// Supercluster indices are too expensive to keep duplicated in a hidden tree.
const useIsDesktopLayout = () => {
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 768px)').matches)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const handleChange = () => setIsDesktop(mediaQuery.matches)
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return isDesktop
}

export const BrowsedChallengePageContent = () => {
  const [showMap, setShowMap] = useState(false)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const isDesktop = useIsDesktopLayout()

  useEffect(() => {
    if (showMap && mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [showMap])

  const mapToggleValue = useMemo(() => ({ showMap, setShowMap }), [showMap])

  return (
    <MapToggleContext.Provider value={mapToggleValue}>
      <ChallengeModalsProvider>
        {isDesktop ? (
          <div className="relative h-full overflow-hidden px-4">
            <ResizablePanelGroup direction="horizontal">
              <ResizablePanel defaultSize={35} minSize={25} maxSize={50}>
                <div className="relative h-full overflow-hidden">
                  <ChallengePanel />
                  <DrawerPortalTarget />
                </div>
              </ResizablePanel>
              <ResizableHandle withHandle className="ml-2" />
              <ResizablePanel defaultSize={65}>
                <div
                  ref={mapContainerRef}
                  className="h-full overflow-hidden rounded-lg border border-slate-700/50"
                >
                  <BrowseChallengeMap />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        ) : showMap ? (
          <div className="relative flex h-full flex-col gap-4 overflow-hidden px-4">
            <div
              ref={mapContainerRef}
              className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-700/50"
            >
              <BrowseChallengeMap />
            </div>
            <ChallengeFooter />
            <DrawerPortalTarget />
          </div>
        ) : (
          <div className="relative h-full overflow-hidden px-4">
            <ChallengePanel />
            <DrawerPortalTarget />
          </div>
        )}
        <ChallengeModals />
      </ChallengeModalsProvider>
    </MapToggleContext.Provider>
  )
}
