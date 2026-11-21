import type maplibregl from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import { apiBaseUrl } from '@/api/client'
import { boundsAreEqual, getMapBoundsString, parseBoundsString } from '@/components/Map/mapUtils'
import {
  type ClusterMarkerFeature,
  declutterClusterMarkers,
} from '@/components/Map/TaskMarkers/clusterUtils'
import type { TaskTypeKey } from '@/components/Map/TaskMarkers/taskTypes'
import { useChallengeTypes } from '@/components/Map/TaskMarkers/useChallengeTypes'
import type { TaskMarker } from '@/types/Task'
import { useExploreChallengesSearchContext } from '../contexts/ExploreChallengesSearchContext'

export const MVT_SOURCE_ID = 'mvt-data'
export const MVT_SOURCE_LAYER = 'default'
const VIEW_BUFFER_DEGREES = 1
const EXTRACT_DEBOUNCE_MS = 150

export interface ExploreMarker extends TaskMarker {
  challengeId: number | null
  stackSize: number
  typeKey: TaskTypeKey | null
}

interface TileContents {
  tasks: ExploreMarker[]
  clusters: ClusterMarkerFeature[]
}

const EMPTY_TILES: TileContents = { tasks: [], clusters: [] }

/**
 * The tasks and backend cluster markers in the loaded MVT tiles around the
 * current view. Tiles overlap at their edges, so features are de-duplicated.
 */
const readTiles = (map: maplibregl.Map): TileContents => {
  const b = map.getBounds()
  const west = b.getWest() - VIEW_BUFFER_DEGREES
  const east = b.getEast() + VIEW_BUFFER_DEGREES
  const south = b.getSouth() - VIEW_BUFFER_DEGREES
  const north = b.getNorth() + VIEW_BUFFER_DEGREES

  const tasks = new Map<number, ExploreMarker>()
  const clusters = new Map<string, ClusterMarkerFeature>()

  for (const f of map.querySourceFeatures(MVT_SOURCE_ID, { sourceLayer: MVT_SOURCE_LAYER })) {
    const geometry = f.geometry
    if (geometry.type !== 'Point') continue
    const [lng, lat] = geometry.coordinates
    if (lng < west || lng > east || lat < south || lat > north) continue

    const props = f.properties
    if (props.group_type === 0) {
      if ((props.status ?? 0) !== 0) continue
      tasks.set(props.id, {
        id: props.id,
        location: { lng, lat },
        status: 0,
        priority: props.priority ?? 0,
        challengeId: props.challenge_id ?? null,
        stackSize: 1,
        typeKey: null,
      })
    } else if (props.group_type === 1) {
      // Stacked tasks come with ids only, so they're drawn as one stack marker
      // and never show a priority or type of their own.
      const ids = String(props.task_ids_str).split(',').map(Number)
      for (const id of ids) {
        tasks.set(id, {
          id,
          location: { lng, lat },
          status: 0,
          priority: 0,
          challengeId: null,
          stackSize: ids.length,
          typeKey: null,
        })
      }
    } else {
      const taskCount = props.task_count || 1
      clusters.set(`${lng.toFixed(5)}-${lat.toFixed(5)}-${taskCount}`, { geometry, taskCount })
    }
  }

  return {
    tasks: [...tasks.values()],
    // The backend spaces its markers out within a tile but cannot see across
    // tile boundaries, so bubbles from neighbouring tiles can still land on top
    // of each other. Every loaded tile is in this list, so resolve them here.
    // This uses the zoom at read time, so a zoom-out gesture can leave bubbles
    // overlapping until the move ends.
    clusters: declutterClusterMarkers([...clusters.values()], map.getZoom()),
  }
}

export const useExploreChallengesMap = () => {
  const {
    cluster,
    setCluster,
    locationGeojson,
    setBounds,
    bounds,
    pendingFitBounds,
    clearPendingFitBounds,
  } = useExploreChallengesSearchContext()
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(true)
  const [selectedTask, setSelectedTask] = useState<ExploreMarker | null>(null)
  const [tiles, setTiles] = useState<TileContents>(EMPTY_TILES)
  const boundsUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // The map shows all available work: challenge-level filters live on the grid
  // and list views, so a tile depends on nothing but its coordinates. That is
  // what lets every tile below z=12 be served from the pre-computed pyramid.
  const tileUrl = `${apiBaseUrl}/api/v2/taskTilesMvt/{z}/{x}/{y}`

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current.getMap()

    let debounceTimeout: NodeJS.Timeout | null = null

    const extract = () => {
      if (!map.getSource(MVT_SOURCE_ID)) return
      const next = readTiles(map)
      // querySourceFeatures returns nothing once MapLibre overzooms past the
      // source's maxzoom (z=12 here) by more than a few levels. Keep the last
      // good extraction in that case so markers don't blink out at high zoom.
      setTiles((prev) =>
        next.tasks.length === 0 && next.clusters.length === 0 && prev !== EMPTY_TILES ? prev : next
      )
    }

    const debouncedExtract = () => {
      if (debounceTimeout) clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(extract, EXTRACT_DEBOUNCE_MS)
    }

    const onSourceData = (e: maplibregl.MapSourceDataEvent) => {
      if (e.sourceId === MVT_SOURCE_ID && e.isSourceLoaded) debouncedExtract()
    }

    map.on('sourcedata', onSourceData)
    map.on('moveend', debouncedExtract)
    debouncedExtract()

    return () => {
      map.off('sourcedata', onSourceData)
      map.off('moveend', debouncedExtract)
      if (debounceTimeout) clearTimeout(debounceTimeout)
    }
  }, [mapLoaded])

  // Marker-tile loading state for the "Loading task markers…" indicator. The
  // markers are served from the MVT source, which starts loading on filter
  // changes and map movement; `idle` fires once the map has finished loading
  // and rendering everything.
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current.getMap()

    const onSourceLoading = (e: maplibregl.MapSourceDataEvent) => {
      if (e.sourceId === MVT_SOURCE_ID) queueMicrotask(() => setIsLoadingMarkers(true))
    }
    const onIdle = () => setIsLoadingMarkers(false)

    map.on('sourcedataloading', onSourceLoading)
    map.on('idle', onIdle)

    return () => {
      map.off('sourcedataloading', onSourceLoading)
      map.off('idle', onIdle)
    }
  }, [mapLoaded])

  // Move the camera to a place the user picked.
  //
  // The request is explicit -- LocationSearchFilter calls `requestFitBounds`
  // when it applies a place -- rather than the map inferring it from the
  // outline appearing. Inferring it cannot tell "the user just searched" from
  // "a shared link restored a place", and the version that tried skipped the
  // fit whenever `window.location.hash` was non-empty. The map writes its own
  // camera into that hash (`hash` on MapGL), so the hash is never empty once
  // the map has moved, and every real search was silently ignored.
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || !pendingFitBounds) return

    const map = mapRef.current.getMap()
    const target = parseBoundsString(pendingFitBounds)
    if (target) {
      map.fitBounds(target, { padding: 50, duration: 1000, maxZoom: 18 })
    }

    // Clear even when the bounds were unparseable, or the request sticks around
    // and re-fires on every later render.
    clearPendingFitBounds()
  }, [pendingFitBounds, mapLoaded, clearPendingFitBounds])

  const challengeIds = useMemo(
    () => [...new Set(tiles.tasks.flatMap((task) => task.challengeId ?? []))],
    [tiles]
  )
  const challengeTypes = useChallengeTypes(challengeIds)

  // A task is held back until its challenge's type is known, so its pin is
  // drawn once with the right icon rather than switching after the tags load.
  const markers = useMemo(
    () =>
      tiles.tasks.flatMap((task) => {
        if (task.challengeId === null) return [task]
        const typeKey = challengeTypes.get(task.challengeId)
        return typeKey === undefined ? [] : [{ ...task, typeKey }]
      }),
    [tiles, challengeTypes]
  )

  const handleMapMoveEnd = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    if (boundsUpdateTimeoutRef.current) clearTimeout(boundsUpdateTimeoutRef.current)

    boundsUpdateTimeoutRef.current = setTimeout(() => {
      const boundsString = getMapBoundsString(map)

      if (!bounds || !boundsAreEqual(boundsString, bounds)) {
        setBounds(boundsString)
      }
    }, 300)
  }, [setBounds, bounds])

  useEffect(() => {
    return () => {
      if (boundsUpdateTimeoutRef.current) clearTimeout(boundsUpdateTimeoutRef.current)
    }
  }, [])

  return {
    mapRef,
    mapLoaded,
    setMapLoaded,
    isLoadingMarkers,
    selectedTask,
    setSelectedTask,
    cluster,
    setCluster,
    tileUrl,
    markers,
    backendClusters: tiles.clusters,
    handleMapMoveEnd,
    locationGeojson,
  }
}
