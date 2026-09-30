import type * as maplibregl from 'maplibre-gl'
import type { TaskTypeKey } from '@/components/Map/TaskMarkers/taskTypes'
import type { TaskMarker } from '@/types/Task'

// Spider positioning constants (matching Leaflet implementation)
const MAX_CIRCLE_MARKERS = 8
const CIRCLE_START_ANGLE = (Math.PI * 2) / 12
const SPIRAL_LENGTH_START = 11
const SPIRAL_FOOT_SEPARATION = 28
const SPIRAL_LENGTH_FACTOR = 5
const CLUSTER_ICON_PIXELS = 40

/**
 * Detect visually overlapping markers at a specific point on the map
 * Uses screen/pixel coordinates to detect overlaps
 * Returns markers with the top marker first (the one that would be clicked)
 *
 * Only returns markers that are truly overlapping - i.e., markers whose
 * rendered screen positions are within a very tight tolerance of each other.
 */
export const detectVisualOverlaps = (
  map: maplibregl.Map,
  point: { x: number; y: number },
  layerId: string | readonly string[],
  pixelTolerance: number = 2 // Strict tolerance - only truly overlapping markers
): TaskMarker[] => {
  const layers = Array.isArray(layerId) ? [...layerId] : [layerId as string]
  // Query at the exact point to get the clicked marker
  const exactFeatures = map.queryRenderedFeatures([point.x, point.y], {
    layers,
  })

  if (exactFeatures.length === 0) {
    return []
  }

  // Get the clicked marker's geographic coordinates
  const clickedFeature = exactFeatures[0]
  if (!clickedFeature || clickedFeature.geometry.type !== 'Point') {
    return []
  }

  const clickedCoords = clickedFeature.geometry.coordinates as [number, number]
  const clickedScreenPos = map.project(clickedCoords)

  // Query a small area to find nearby markers
  const areaFeatures = map.queryRenderedFeatures(
    [
      [point.x - 15, point.y - 20], // Account for marker icon size (32x44)
      [point.x + 15, point.y + 20],
    ],
    {
      layers,
    }
  )

  // Filter to only include markers that are truly overlapping
  // Check if each marker's screen position is within tight tolerance of the clicked marker
  const seenIds = new Set<number>()
  const markers: TaskMarker[] = []

  areaFeatures.forEach((feature) => {
    if (feature.properties?.id && feature.geometry.type === 'Point') {
      const taskId = feature.properties.id as number
      if (seenIds.has(taskId)) return

      const coordinates = feature.geometry.coordinates as [number, number]
      const screenPos = map.project(coordinates)

      // Check if this marker's screen position is within tight tolerance of clicked marker
      const dx = Math.abs(screenPos.x - clickedScreenPos.x)
      const dy = Math.abs(screenPos.y - clickedScreenPos.y)

      // Only include if truly overlapping (within pixelTolerance pixels)
      if (dx <= pixelTolerance && dy <= pixelTolerance) {
        seenIds.add(taskId)
        const typeKey = (feature.properties.typeKey as TaskTypeKey | undefined) ?? null
        markers.push({
          id: taskId,
          location: {
            lng: coordinates[0],
            lat: coordinates[1],
          },
          status: feature.properties.status ?? 0,
          priority: feature.properties.priority ?? 0,
          ...(typeKey ? { typeKey } : {}),
        } as TaskMarker & { typeKey?: TaskTypeKey | null })
      }
    }
  })

  return markers
}

/**
 * Spider markers in a circle pattern (for 8 or fewer markers)
 * Based on https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet
 */
const spiderCircle = (
  map: maplibregl.Map,
  centerPointPx: { x: number; y: number },
  markers: TaskMarker[]
): Map<number, { original: [number, number]; spidered: [number, number] }> => {
  const spiderMap = new Map<number, { original: [number, number]; spidered: [number, number] }>()

  const circumferencePx = (CLUSTER_ICON_PIXELS / 2) * (2 + markers.length)
  const legLengthPx = circumferencePx / (Math.PI * 2) // radius from circumference
  const angleStep = (Math.PI * 2) / markers.length

  markers.forEach((marker, index) => {
    const originalPos: [number, number] = [marker.location.lng, marker.location.lat]
    const angle = CIRCLE_START_ANGLE + index * angleStep

    const spideredPx = {
      x: centerPointPx.x + legLengthPx * Math.cos(angle),
      y: centerPointPx.y + legLengthPx * Math.sin(angle),
    }

    // Convert pixel position back to lng/lat
    const spideredLngLat = map.unproject([spideredPx.x, spideredPx.y])

    spiderMap.set(marker.id, {
      original: originalPos,
      spidered: [spideredLngLat.lng, spideredLngLat.lat],
    })
  })

  return spiderMap
}

/**
 * Spider markers in a spiral pattern (for more than 8 markers)
 * Based on https://github.com/jawj/OverlappingMarkerSpiderfier-Leaflet
 */
const spiderSpiral = (
  map: maplibregl.Map,
  centerPointPx: { x: number; y: number },
  markers: TaskMarker[]
): Map<number, { original: [number, number]; spidered: [number, number] }> => {
  const spiderMap = new Map<number, { original: [number, number]; spidered: [number, number] }>()

  let legLengthPx = SPIRAL_LENGTH_START
  let angle = 0

  markers.forEach((marker, index) => {
    const originalPos: [number, number] = [marker.location.lng, marker.location.lat]

    angle += SPIRAL_FOOT_SEPARATION / legLengthPx + index * 0.0005

    const spideredPx = {
      x: centerPointPx.x + legLengthPx * Math.cos(angle),
      y: centerPointPx.y + legLengthPx * Math.sin(angle),
    }

    // Convert pixel position back to lng/lat
    const spideredLngLat = map.unproject([spideredPx.x, spideredPx.y])

    spiderMap.set(marker.id, {
      original: originalPos,
      spidered: [spideredLngLat.lng, spideredLngLat.lat],
    })

    legLengthPx += (Math.PI * 2 * SPIRAL_LENGTH_FACTOR) / angle
  })

  return spiderMap
}

/**
 * Calculate spider positions for a group of overlapping markers
 * Uses pixel-based positioning with circle (≤8 markers) or spiral (>8 markers) patterns
 * Based on the Leaflet OverlappingMarkerSpiderfier algorithm
 */
export const createSpiderGroup = (
  markers: TaskMarker[],
  clickPoint: [number, number],
  map: maplibregl.Map
): Map<number, { original: [number, number]; spidered: [number, number] }> => {
  const spiderMap = new Map<number, { original: [number, number]; spidered: [number, number] }>()

  if (markers.length === 0) return spiderMap

  if (markers.length === 1) {
    const marker = markers[0]
    const originalPos: [number, number] = [marker.location.lng, marker.location.lat]
    // Single marker - offset slightly upward
    const centerPx = map.project(clickPoint)
    const spideredPx = { x: centerPx.x, y: centerPx.y - CLUSTER_ICON_PIXELS / 2 }
    const spideredLngLat = map.unproject([spideredPx.x, spideredPx.y])
    spiderMap.set(marker.id, {
      original: originalPos,
      spidered: [spideredLngLat.lng, spideredLngLat.lat],
    })
    return spiderMap
  }

  // Convert click point to pixel coordinates
  const centerPointPx = map.project(clickPoint)

  // Use circle for 8 or fewer markers, spiral for more
  if (markers.length <= MAX_CIRCLE_MARKERS) {
    return spiderCircle(map, centerPointPx, markers)
  } else {
    return spiderSpiral(map, centerPointPx, markers)
  }
}
