import { useEffect, useState } from 'react'
import { createMarkerIcons } from '@/components/Map/TaskMarkers/createMarkerIcons'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'

/**
 * (Re)registers the map's marker icon images and bumps a version counter each
 * time they finish loading, so consumers can force a repaint/re-style of
 * anything keyed off marker icon availability.
 */
export const useMarkerIconsVersion = (mapLoaded: boolean, shouldCluster: boolean) => {
  const { map: mapRef } = useTaskMapContext()
  const [iconsVersion, setIconsVersion] = useState(0)

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const map = mapRef.current.getMap()
    if (!map) return

    const registerIcons = () => {
      createMarkerIcons({ current: map }, () => {
        map.triggerRepaint()

        setIconsVersion((v) => v + 1)
      })
    }

    registerIcons()

    // A newly loaded basemap style starts with no images of its own, so the
    // icons go back on with each one - otherwise switching style (by hand, or
    // by landing in a challenge with a different basemap) leaves the markers
    // with nothing to draw. Re-registering is a no-op for icons still present.
    map.on('style.load', registerIcons)
    return () => {
      map.off('style.load', registerIcons)
    }
  }, [mapLoaded, mapRef, shouldCluster])

  return iconsVersion
}
