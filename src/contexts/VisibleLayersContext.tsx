import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { logger } from '@/lib/logger'
import type { CustomOverlay } from '@/types/MapLayer'

const OVERLAYS_STORAGE_KEY = 'mr4:map:overlays'
const CUSTOM_OVERLAYS_STORAGE_KEY = 'mr4:map:customOverlays'

interface VisibleLayersContextValue {
  overlays: Record<string, boolean>
  toggleOverlay: (id: string) => void
  setOverlay: (id: string, visible: boolean) => void
  customOverlays: CustomOverlay[]
  addCustomOverlay: (overlay: Omit<CustomOverlay, 'id'>) => CustomOverlay
  updateCustomOverlay: (id: string, patch: Partial<CustomOverlay>) => void
  removeCustomOverlay: (id: string) => void
}

const VisibleLayersContext = createContext<VisibleLayersContextValue | null>(null)

const readJSON = <T,>(key: string, fallback: T): T => {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

const writeJSON = (key: string, value: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch (error) {
    logger.warn(`Failed to persist ${key} to localStorage`, { error })
  }
}

const genId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `overlay-${Date.now()}-${Math.floor(Math.random() * 1e6)}`

export const VisibleLayersProvider = ({ children }: { children: ReactNode }) => {
  const [overlays, setOverlays] = useState<Record<string, boolean>>(() =>
    readJSON(OVERLAYS_STORAGE_KEY, {} as Record<string, boolean>)
  )
  const [customOverlays, setCustomOverlays] = useState<CustomOverlay[]>(() =>
    readJSON(CUSTOM_OVERLAYS_STORAGE_KEY, [] as CustomOverlay[])
  )

  useEffect(() => {
    writeJSON(OVERLAYS_STORAGE_KEY, overlays)
  }, [overlays])

  useEffect(() => {
    writeJSON(CUSTOM_OVERLAYS_STORAGE_KEY, customOverlays)
  }, [customOverlays])

  const toggleOverlay = useCallback((id: string) => {
    setOverlays((prev) => ({ ...prev, [id]: !prev[id] }))
  }, [])

  const setOverlay = useCallback((id: string, visible: boolean) => {
    setOverlays((prev) => ({ ...prev, [id]: visible }))
  }, [])

  const addCustomOverlay = useCallback((overlay: Omit<CustomOverlay, 'id'>): CustomOverlay => {
    const next: CustomOverlay = { ...overlay, id: genId() }
    setCustomOverlays((prev) => [...prev, next])
    return next
  }, [])

  const updateCustomOverlay = useCallback((id: string, patch: Partial<CustomOverlay>) => {
    setCustomOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)))
  }, [])

  const removeCustomOverlay = useCallback((id: string) => {
    setCustomOverlays((prev) => prev.filter((o) => o.id !== id))
  }, [])

  const value = useMemo<VisibleLayersContextValue>(
    () => ({
      overlays,
      toggleOverlay,
      setOverlay,
      customOverlays,
      addCustomOverlay,
      updateCustomOverlay,
      removeCustomOverlay,
    }),
    [
      overlays,
      toggleOverlay,
      setOverlay,
      customOverlays,
      addCustomOverlay,
      updateCustomOverlay,
      removeCustomOverlay,
    ]
  )

  return <VisibleLayersContext.Provider value={value}>{children}</VisibleLayersContext.Provider>
}

export const useVisibleLayers = () => {
  const ctx = useContext(VisibleLayersContext)
  if (!ctx) {
    throw new Error('useVisibleLayers must be used within VisibleLayersProvider')
  }
  return ctx
}
