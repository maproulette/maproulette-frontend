import { useEffect } from 'react'
import { useMap } from 'react-map-gl/maplibre'
import { OVERLAY_GLYPHS_URL } from '@/components/Map/mapStyles'
import { attachMarkerIcons } from '@/components/Map/TaskMarkers/createMarkerIcons'

export const useTaskMarkerResources = () => {
  const { current: mapInstance } = useMap()

  useEffect(() => {
    const map = mapInstance?.getMap()
    if (!map) return
    return attachMarkerIcons(map)
  }, [mapInstance])

  useEffect(() => {
    const map = mapInstance?.getMap()
    if (!map) return

    // TODO: this overwrites any existing glyphs URL, which may break vector
    // styles if they use a different glyphs source.
    const applyGlyphs = () => map.setGlyphs(OVERLAY_GLYPHS_URL)
    if (map.isStyleLoaded()) applyGlyphs()
    map.on('style.load', applyGlyphs)

    return () => {
      map.off('style.load', applyGlyphs)
    }
  }, [mapInstance])
}
