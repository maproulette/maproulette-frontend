import { createContext, type ReactNode, useCallback, useContext, useMemo, useState } from 'react'

interface DrawerPortalContextType {
  portalTarget: HTMLDivElement | null
  setPortalTarget: (el: HTMLDivElement | null) => void
}

const DrawerPortalContext = createContext<DrawerPortalContextType | null>(null)

export const DrawerPortalProvider = ({ children }: { children: ReactNode }) => {
  const [portalTarget, setPortalTarget] = useState<HTMLDivElement | null>(null)
  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo(() => ({ portalTarget, setPortalTarget }), [portalTarget])
  return <DrawerPortalContext.Provider value={value}>{children}</DrawerPortalContext.Provider>
}

export const useDrawerPortal = () => {
  const ctx = useContext(DrawerPortalContext)
  if (!ctx) throw new Error('useDrawerPortal must be used within DrawerPortalProvider')
  return ctx
}

/** Attach this as a ref callback on the div where the drawer should render */
export const DrawerPortalTarget = () => {
  const { setPortalTarget } = useDrawerPortal()
  // Reason: ref callback must be stable to avoid React re-attaching on every render
  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      setPortalTarget(el)
    },
    [setPortalTarget]
  )
  return <div ref={ref} />
}
