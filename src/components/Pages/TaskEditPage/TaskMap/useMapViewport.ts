import { useEffect, useState } from 'react'
import { mapBoundsToBbox } from '@/components/Map/mapUtils'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import type { Bbox2D } from '@/types/Map'

export const useMapViewport = (mapLoaded: boolean) => {
  const { map: mapRef } = useTaskMapContext()
  const [mapZoom, setMapZoom] = useState(2)
  const [mapBounds, setMapBounds] = useState<Bbox2D>([-180, -85, 180, 85])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    const map = mapRef.current.getMap()
    if (!map) return

    const updateViewport = () => {
      setMapBounds(mapBoundsToBbox(map.getBounds()))
      setMapZoom(map.getZoom())
    }

    updateViewport()
    map.on('moveend', updateViewport)

    return () => {
      map.off('moveend', updateViewport)
    }
  }, [mapLoaded, mapRef])

  return { mapBounds, mapZoom }
}
