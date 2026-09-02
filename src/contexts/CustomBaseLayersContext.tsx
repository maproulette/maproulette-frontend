import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo } from 'react'
import { api } from '@/api'
import {
  addCustomBaseLayer,
  type CustomBaseLayer,
  getCustomBaseLayers,
  removeCustomBaseLayer,
  replaceCustomBaseLayers,
  toStoredLayer,
  toUserBasemap,
} from '@/components/Map/customBaseLayers'
import { useAuthContext } from '@/contexts/AuthContext'
import { logger } from '@/lib/logger'
import type { UserSettings } from '@/types/User'

interface CustomBaseLayersContextValue {
  layers: CustomBaseLayer[]
  addLayer: (layer: Omit<CustomBaseLayer, 'id'>) => void
  removeLayer: (id: string) => void
}

const CustomBaseLayersContext = createContext<CustomBaseLayersContextValue | null>(null)

/**
 * The base layers a mapper has added themselves.
 *
 * Signed in, these live on the account (`settings.customBasemaps`) so they
 * follow the mapper between devices. Browser storage is kept as a mirror,
 * because the map style helpers are plain functions called outside React and
 * need to resolve a layer synchronously. Signed out, the mirror is all there
 * is and the layers last only as long as that browser keeps them.
 */
export const CustomBaseLayersProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuthContext()
  const updateSettings = api.user.useUpdateUserSettings()

  const accountLayers = useMemo(
    () => (user?.settings?.customBasemaps ?? []).filter((basemap) => !basemap.overlay),
    [user?.settings?.customBasemaps]
  )

  // Bring the mirror in line with the account whenever the account's copy
  // changes, so a layer added on another device shows up here.
  useEffect(() => {
    if (!user) return
    replaceCustomBaseLayers(accountLayers.map(toStoredLayer))
  }, [user, accountLayers])

  const layers = user ? accountLayers.map(toStoredLayer) : getCustomBaseLayers()

  const persist = useCallback(
    (next: CustomBaseLayer[]) => {
      replaceCustomBaseLayers(next)
      if (!user) return
      const overlays = (user.settings?.customBasemaps ?? []).filter((basemap) => basemap.overlay)
      updateSettings
        .mutateAsync({
          userId: user.id,
          settings: {
            ...user.settings,
            customBasemaps: [...overlays, ...next.map(toUserBasemap)],
          } as UserSettings,
        })
        .catch((error) => {
          logger.error('Failed to save custom base layers to the account', { error })
        })
    },
    [user, updateSettings]
  )

  const addLayer = useCallback(
    (layer: Omit<CustomBaseLayer, 'id'>) => {
      const created = addCustomBaseLayer(layer)
      persist([...layers, created])
    },
    [layers, persist]
  )

  const removeLayer = useCallback(
    (id: string) => {
      removeCustomBaseLayer(id)
      persist(layers.filter((layer) => layer.id !== id))
    },
    [layers, persist]
  )

  const value = useMemo(() => ({ layers, addLayer, removeLayer }), [layers, addLayer, removeLayer])

  return (
    <CustomBaseLayersContext.Provider value={value}>{children}</CustomBaseLayersContext.Provider>
  )
}

export const useCustomBaseLayers = () => {
  const context = useContext(CustomBaseLayersContext)
  if (!context) {
    throw new Error('useCustomBaseLayers must be used within a CustomBaseLayersProvider')
  }
  return context
}
