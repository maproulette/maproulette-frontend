import type * as maplibregl from 'maplibre-gl'
import { CLUSTER_CONFIG } from '@/components/Map/TaskMarkers/const'

/** Minimal structural slice of `Supercluster` so callers don't have to plumb
 * their full `<PointProps, ClusterProps>` generics through this helper. */
export interface ClusterExpansionIndex {
  getClusterExpansionZoom(clusterId: number): number
}

const DEFAULT_FLY_DURATION_MS = 600
const FALLBACK_ZOOM_BOOST = 2

/**
 * Smoothly fly the map to the zoom level at which a clicked Supercluster
 * cluster splits. Falls back to (currentZoom + 2) when the index is missing,
 * the cluster id is undefined, or `getClusterExpansionZoom` throws. Always
 * clamps to the map's max zoom. Reusable across every map that wires up a
 * client-side cluster click handler.
 */
export const flyToClusterExpansion = (
  map: maplibregl.Map,
  index: ClusterExpansionIndex | null | undefined,
  clusterId: number | undefined,
  coordinates: [number, number],
  duration: number = DEFAULT_FLY_DURATION_MS
): void => {
  const maxZoom = map.getMaxZoom()
  const fallbackZoom = Math.min(map.getZoom() + FALLBACK_ZOOM_BOOST, maxZoom)

  if (index && clusterId !== undefined) {
    try {
      const zoom = index.getClusterExpansionZoom(clusterId)
      map.flyTo({
        center: coordinates,
        zoom: Math.min(zoom, maxZoom),
        duration,
      })
      return
    } catch {
      // Fall through to the default boost below.
    }
  }

  map.flyTo({ center: coordinates, zoom: fallbackZoom, duration })
}

/** A backend cluster marker: where it sits and how many tasks it reports. */
export interface ClusterMarkerFeature {
  geometry: GeoJSON.Point
  taskCount: number
}

/** Gap left between two bubble edges, in CSS pixels, before they count as clear. */
const DECLUTTER_GAP_PX = 2

/**
 * Cap on declutter passes. Absorbing a neighbour can push a marker's count over
 * a `CLUSTER_CONFIG.steps` threshold and grow its bubble by a pixel or two,
 * which can in turn touch a bubble that was previously clear -- so the pass runs
 * again on the survivors until nothing more is displaced. Each pass strictly
 * shrinks the set, and a step of growth is small next to the gap, so it settles
 * in one or two; this is only a backstop.
 */
const MAX_DECLUTTER_PASSES = 4

/** Web Mercator tile size MapLibre draws vector tiles at, in CSS pixels. */
const TILE_SIZE_PX = 512

/**
 * Radius the cluster layer will draw a bubble of `count` tasks at, in CSS
 * pixels. Mirrors the `step` expression in `clusterLayer`'s `circle-radius`:
 * `sizes[i]` applies from `steps[i - 1]` up to `steps[i]`.
 */
export const clusterRadiusForCount = (count: number): number => {
  const step = CLUSTER_CONFIG.steps.findIndex((threshold) => count < threshold)
  return step === -1
    ? CLUSTER_CONFIG.sizes[CLUSTER_CONFIG.steps.length]
    : CLUSTER_CONFIG.sizes[step]
}

interface PlacedMarker<T> {
  marker: T
  x: number
  y: number
  taskCount: number
}

/**
 * Web Mercator pixel position at `zoom`. Equivalent to `map.project` on a
 * north-up map, but independent of where the map is centred, so panning cannot
 * change which markers merge.
 */
const placeMarker = <T extends ClusterMarkerFeature>(
  marker: T,
  worldPx: number
): PlacedMarker<T> => {
  const [lng, lat] = marker.geometry.coordinates
  const clampedLat = Math.max(-85.051129, Math.min(85.051129, lat))
  const sinLat = Math.sin((clampedLat * Math.PI) / 180)
  return {
    marker,
    x: ((lng + 180) / 360) * worldPx,
    y: (0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI)) * worldPx,
    taskCount: marker.taskCount,
  }
}

/** Biggest count first, position breaking ties so the result is stable. */
const byPrecedence = <T>(a: PlacedMarker<T>, b: PlacedMarker<T>): number =>
  b.taskCount - a.taskCount || a.x - b.x || a.y - b.y

/**
 * Drop backend cluster markers whose bubbles would visibly overlap, folding the
 * count of each dropped marker into the one that displaced it.
 *
 * The backend keeps its own markers a minimum distance apart, but it clusters
 * one MVT tile at a time and so never compares a marker against those of the
 * neighbouring tile. Two markers a few pixels either side of a tile boundary are
 * the result -- one bubble drawn over another, its label hidden by MapLibre's
 * own symbol collision. Here every loaded tile's markers are in one list with
 * the map's zoom known, which is the first point where that pair can be seen at
 * all.
 *
 * Markers are considered biggest-count first, so the bubble a reader would
 * notice missing is the one that survives, and a marker is kept only when it
 * clears every already-kept bubble by DECLUTTER_GAP_PX. Overlap is judged
 * against the radii the layer actually draws, so small bubbles may sit closer
 * together than large ones instead of every pair paying the worst case. A
 * dropped marker's tasks are added to the nearest survivor -- positions never
 * move, so absorbing a neighbour cannot push a bubble into another one -- and
 * the counts on screen still add up to the tasks in view.
 *
 * `zoom` is the map's live fractional zoom: at zoom 9.8 a z=9 tile is drawn at
 * 1.7x, and markers that overlapped at 1x no longer do.
 */
export const declutterClusterMarkers = <T extends ClusterMarkerFeature>(
  markers: T[],
  zoom: number
): Array<T & { taskCount: number }> => {
  if (markers.length < 2) return markers.map((marker) => ({ ...marker }))

  const worldPx = TILE_SIZE_PX * 2 ** zoom
  let round = markers.map((marker) => placeMarker(marker, worldPx)).sort(byPrecedence)

  for (let pass = 0; pass < MAX_DECLUTTER_PASSES; pass++) {
    const kept: Array<PlacedMarker<T>> = []
    const displaced: Array<PlacedMarker<T>> = []

    for (const candidate of round) {
      const candidateRadius = clusterRadiusForCount(candidate.taskCount)
      const clear = kept.every((survivor) => {
        const dx = survivor.x - candidate.x
        const dy = survivor.y - candidate.y
        const clearance =
          clusterRadiusForCount(survivor.taskCount) + candidateRadius + DECLUTTER_GAP_PX
        return dx * dx + dy * dy >= clearance * clearance
      })

      if (clear) kept.push(candidate)
      else displaced.push(candidate)
    }

    if (displaced.length === 0) break

    for (const dropped of displaced) {
      let host = kept[0]
      let hostDistance = Infinity
      for (const survivor of kept) {
        const dx = survivor.x - dropped.x
        const dy = survivor.y - dropped.y
        const distance = dx * dx + dy * dy
        if (distance < hostDistance) {
          hostDistance = distance
          host = survivor
        }
      }
      host.taskCount += dropped.taskCount
    }

    // Counts changed, so precedence may have too -- re-rank before checking
    // whether the grown bubbles now touch.
    round = kept.sort(byPrecedence)
  }

  return round.map(({ marker, taskCount }) => ({ ...marker, taskCount }))
}
