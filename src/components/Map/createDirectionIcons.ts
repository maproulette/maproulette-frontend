import { registerIcon } from '@/components/Map/TaskMarkers/createMarkerIcons'
import { DIRECTION_ICONS } from './directionIndicators'

/**
 * Registers the images the direction indicator layers draw with. Each one is
 * outlined in white so it stays readable over both the geometry it sits on and
 * whatever basemap is underneath.
 */

const ARROW_SIZE = { width: 16, height: 16 }
const ENDPOINT_SIZE = { width: 18, height: 18 }

// Points east: with `symbol-placement: 'line'` MapLibre rotates the image to
// the bearing of the line segment it lands on, so an east-facing arrow ends up
// pointing the way the line runs.
const ARROW_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">
    <path d="M4 3 L11 8 L4 13" fill="none" stroke="#ffffff" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 3 L11 8 L4 13" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`

// Start and end differ in shape as well as color, so the two are still
// distinguishable without relying on color alone.
const START_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
    <circle cx="9" cy="9" r="6.5" fill="#22c55e" stroke="#ffffff" stroke-width="3"/>
  </svg>`

const END_SVG = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 18">
    <rect x="2.5" y="2.5" width="13" height="13" rx="2" fill="#ef4444" stroke="#ffffff" stroke-width="3"/>
  </svg>`

export const createDirectionIcons = (
  map: React.RefObject<maplibregl.Map | null>,
  onReady?: () => void
) => {
  const currentMap = map.current
  if (!currentMap) return

  // Fires once all three images are on the map, whether this call registered
  // them or a previous one already had (`registerIcon` stays quiet in that
  // case, and the layers still need to know they can draw).
  const reportWhenReady = () => {
    const mapInstance = map.current
    if (!mapInstance) return
    try {
      if (Object.values(DIRECTION_ICONS).every((name) => mapInstance.hasImage(name))) {
        onReady?.()
      }
    } catch {}
  }

  const addIcons = () => {
    registerIcon(map, DIRECTION_ICONS.arrow, ARROW_SVG, ARROW_SIZE, reportWhenReady)
    registerIcon(map, DIRECTION_ICONS.start, START_SVG, ENDPOINT_SIZE, reportWhenReady)
    registerIcon(map, DIRECTION_ICONS.end, END_SVG, ENDPOINT_SIZE, reportWhenReady)
    reportWhenReady()
  }

  // `registerIcon` needs a loaded style to ask whether an image is already
  // registered, so wait one out if the map is still loading its own.
  if (currentMap.isStyleLoaded()) {
    addIcons()
    return
  }

  const onStyleLoad = () => {
    if (!map.current) return
    addIcons()
    map.current.off('styledata', onStyleLoad)
  }
  currentMap.on('styledata', onStyleLoad)
}
