import type * as maplibregl from 'maplibre-gl'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MapMouseEvent, MapRef } from 'react-map-gl/maplibre'
import Supercluster, { type PointFeature } from 'supercluster'
import { api } from '@/api'
import {
  boundsAreEqual,
  getMapBoundsString,
  mapBoundsToBbox,
  parseBoundsString,
} from '@/components/Map/mapUtils'
import {
  declutterClusterMarkers,
  flyToClusterExpansion,
} from '@/components/Map/TaskMarkers/clusterUtils'
import { CLUSTER_RADIUS_PX, LAYER_IDS } from '@/components/Map/TaskMarkers/const'
import { createMarkerIcons } from '@/components/Map/TaskMarkers/createMarkerIcons'
import { createSpiderGroup, detectVisualOverlaps } from '@/components/Map/TaskMarkers/spiderUtils'
import type { TaskTypeKey } from '@/components/Map/TaskMarkers/taskTypes'
import { useChallengeTypes } from '@/components/Map/TaskMarkers/useChallengeTypes'
import type { Bbox2D } from '@/types/Map'
import type { TaskMarker } from '@/types/Task'
import { useExploreChallengesSearchContext } from '../contexts/ExploreChallengesSearchContext'

const API_BASE_URL = window.env.VITE_API_BASE_URL || 'http://127.0.0.1:9000'
const MVT_SOURCE_ID = 'mvt-data'
const MVT_SOURCE_LAYER = 'default'

interface PointProperties {
  id?: number
  status?: number
  priority?: number
  challenge_id?: number
  typeKey?: TaskTypeKey | null
  group_type: number
  task_count: number
  task_ids_str?: string
  isOverlapping?: boolean
  overlapTaskCount?: number
  _weight: number
}

interface ClusterProperties {
  totalCount: number
}

export const useExploreChallengesMap = () => {
  const {
    cluster,
    setCluster,
    locationGeojson,
    setBounds,
    bounds,
    zoom,
    setZoom,
    pendingFitBounds,
    clearPendingFitBounds,
  } = useExploreChallengesSearchContext()
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [isLoadingMarkers, setIsLoadingMarkers] = useState(true)
  const [selectedTask, setSelectedTask] = useState<TaskMarker | null>(null)
  const [spideredMarkers, setSpideredMarkers] = useState<
    Map<number, { original: [number, number]; spidered: [number, number] }>
  >(new Map())
  const [spideredTaskData, setSpideredTaskData] = useState<TaskMarker[]>([])
  const [pendingOverlap, setPendingOverlap] = useState<{
    taskIds: number[]
    coords: [number, number]
  } | null>(null)
  const boundsUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [extractedFeatures, setExtractedFeatures] = useState<GeoJSON.Feature<GeoJSON.Point>[]>([])
  const [mapZoom, setMapZoom] = useState(2)
  // Supercluster bins by integer zoom, but decluttering the backend's cluster
  // markers is a question about pixels on screen right now: a z=9 tile at map
  // zoom 9.8 is drawn at 1.7x, and bubbles that touched at 1x do not.
  const [mapZoomExact, setMapZoomExact] = useState(2)
  const [mapBounds, setMapBounds] = useState<Bbox2D>([-180, -85, 180, 85])
  const superclusterRef = useRef<Supercluster<PointProperties, ClusterProperties> | null>(null)

  // The map shows all available work: challenge-level filters live on the grid
  // and list views, so a tile depends on nothing but its coordinates. That is
  // what lets every tile below z=12 be served from the pre-computed pyramid.
  const tileUrl = `${API_BASE_URL}/api/v2/taskTilesMvt/{z}/{x}/{y}`

  const selectedTaskGeoJSON = useMemo((): GeoJSON.FeatureCollection => {
    if (!selectedTask?.location) {
      return { type: 'FeatureCollection', features: [] }
    }
    // When the selected task is spidered, SpiderMarkers already draws it (with
    // the -selected variant) at its fanned-out position. Skip the overlay so it
    // doesn't also render a second copy at the original location.
    if (spideredMarkers.has(selectedTask.id)) {
      return { type: 'FeatureCollection', features: [] }
    }
    const typeKey = (selectedTask as TaskMarker & { typeKey?: TaskTypeKey | null }).typeKey ?? null
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [selectedTask.location.lng, selectedTask.location.lat],
          },
          properties: {
            id: selectedTask.id,
            status: selectedTask.status,
            priority: selectedTask.priority,
            isSelected: true,
            ...(typeKey ? { typeKey } : {}),
          },
        },
      ],
    }
  }, [selectedTask, spideredMarkers])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current.getMap()
    if (!map) return

    createMarkerIcons({ current: map }, () => {
      map.triggerRepaint()
    })
  }, [mapLoaded, mapRef])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current.getMap()
    if (!map) return

    let debounceTimeout: NodeJS.Timeout | null = null

    const extractFeatures = () => {
      if (!map.getSource(MVT_SOURCE_ID)) return

      const features = map.querySourceFeatures(MVT_SOURCE_ID, {
        sourceLayer: MVT_SOURCE_LAYER,
      })

      const b = map.getBounds()
      const buffer = 1
      const west = b.getWest() - buffer
      const east = b.getEast() + buffer
      const south = b.getSouth() - buffer
      const north = b.getNorth() + buffer

      const seen = new Map<string, GeoJSON.Feature<GeoJSON.Point>>()
      for (const f of features) {
        if (f.geometry.type !== 'Point') continue
        const [lng, lat] = (f.geometry as GeoJSON.Point).coordinates

        if (lng < west || lng > east || lat < south || lat > north) continue

        const props = f.properties || {}
        let key: string
        if (props.group_type === 0 && props.id != null) {
          key = `s-${props.id}`
        } else if (props.group_type === 1 && props.task_ids_str) {
          key = `o-${props.task_ids_str}`
        } else {
          key = `c-${lng.toFixed(5)}-${lat.toFixed(5)}-${props.task_count}`
        }
        if (!seen.has(key)) {
          seen.set(key, f as GeoJSON.Feature<GeoJSON.Point>)
        }
      }

      const next = Array.from(seen.values())
      // querySourceFeatures returns nothing once MapLibre overzooms past the
      // source's maxzoom (z=12 here) by more than a few levels. Keep the last
      // good extraction in that case so markers don't blink out at high zoom.
      // The Source remounts (key={tileUrl}) on filter / version changes, which
      // re-fires sourcedata and produces a fresh non-empty result.
      setExtractedFeatures((prev) => (next.length === 0 && prev.length > 0 ? prev : next))
    }

    const debouncedExtract = () => {
      if (debounceTimeout) clearTimeout(debounceTimeout)
      debounceTimeout = setTimeout(extractFeatures, 150)
    }

    const onSourceData = (e: maplibregl.MapSourceDataEvent) => {
      if (e.sourceId === MVT_SOURCE_ID && e.isSourceLoaded) {
        debouncedExtract()
      }
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
      if (e.sourceId === MVT_SOURCE_ID) setIsLoadingMarkers(true)
    }
    const onIdle = () => setIsLoadingMarkers(false)

    map.on('sourcedataloading', onSourceLoading)
    map.on('idle', onIdle)

    return () => {
      map.off('sourcedataloading', onSourceLoading)
      map.off('idle', onIdle)
    }
  }, [mapLoaded])

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current.getMap()
    if (!map) return

    const updateViewport = () => {
      setMapBounds(mapBoundsToBbox(map.getBounds()))
      setMapZoom(Math.floor(map.getZoom()))
      setMapZoomExact(map.getZoom())
    }

    updateViewport()
    map.on('move', updateViewport)
    map.on('moveend', updateViewport)

    return () => {
      map.off('move', updateViewport)
      map.off('moveend', updateViewport)
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
    if (map) {
      const target = parseBoundsString(pendingFitBounds)
      if (target) {
        map.fitBounds(target, { padding: 50, duration: 1000, maxZoom: 18 })
      }
    }

    // Clear even when the bounds were unparseable, or the request sticks around
    // and re-fires on every later render.
    clearPendingFitBounds()
  }, [pendingFitBounds, mapLoaded, mapRef, clearPendingFitBounds])

  const { backendClusterFeatures, pointFeatures } = useMemo(() => {
    const backendClusters: GeoJSON.Feature<GeoJSON.Point>[] = []
    const points: PointFeature<PointProperties>[] = []

    for (const f of extractedFeatures) {
      const props = f.properties || {}
      const groupType = (props.group_type as number) ?? 0
      const taskCount = (props.task_count as number) || 1

      if (groupType === 2) {
        backendClusters.push(f)
        continue
      }

      const pointProps: PointProperties = {
        group_type: groupType,
        task_count: taskCount,
        _weight: taskCount,
      }

      if (groupType === 0) {
        const taskStatus = (props.status as number) ?? 0

        if (taskStatus !== 0) continue
        pointProps.id = props.id as number
        pointProps.status = taskStatus
        pointProps.priority = (props.priority as number) ?? 0
        if (props.challenge_id != null) {
          pointProps.challenge_id = props.challenge_id as number
        }
      } else if (groupType === 1) {
        pointProps.isOverlapping = true
        pointProps.overlapTaskCount = taskCount
        pointProps.task_ids_str = props.task_ids_str as string
        const firstId = (props.task_ids_str as string)?.split(',')[0]
        if (firstId) pointProps.id = Number(firstId)
      }

      points.push({
        type: 'Feature' as const,
        geometry: f.geometry,
        properties: pointProps,
      })
    }

    return { backendClusterFeatures: backendClusters, pointFeatures: points }
  }, [extractedFeatures])

  const clusteredIndex = useMemo(() => {
    if (pointFeatures.length === 0) return null

    const idx = new Supercluster<PointProperties, ClusterProperties>({
      radius: CLUSTER_RADIUS_PX,
      // Match the map's max zoom so Supercluster recomputes clusters at every
      // zoom the user can reach. With the default 16, points that ended up
      // clustered at z=16 stayed clustered at z>16 (a "2" bubble at street
      // level even though the underlying tasks are meters apart).
      maxZoom: 22,
      map: (props) => ({ totalCount: props._weight || 1 }),
      reduce: (acc, props) => {
        acc.totalCount += props.totalCount
      },
    })
    idx.load(pointFeatures)
    return idx
  }, [pointFeatures])

  // The cluster-click expansion handler reads superclusterRef. Keep the ref in
  // sync with the active index so it's null when the toggle is off (no clusters
  // to expand) and the live index when on.
  useEffect(() => {
    superclusterRef.current = cluster ? clusteredIndex : null
  }, [cluster, clusteredIndex])

  const visibleChallengeIds = useMemo(() => {
    const ids = new Set<number>()
    for (const p of pointFeatures) {
      const cid = p.properties.challenge_id
      if (cid != null) ids.add(cid)
    }
    return Array.from(ids)
  }, [pointFeatures])
  const challengeTypeMap = useChallengeTypes(visibleChallengeIds)

  const clusteredGeoJSONData = useMemo((): GeoJSON.FeatureCollection => {
    const features: GeoJSON.Feature[] = []

    // The backend spaces its markers out within a tile but cannot see across
    // tile boundaries, so bubbles from neighbouring tiles can still land on top
    // of each other. Every loaded tile is in this list, so resolve them here.
    const declutteredClusters = declutterClusterMarkers(
      backendClusterFeatures.map((f) => ({
        geometry: f.geometry,
        taskCount: (f.properties?.task_count as number) || 1,
      })),
      mapZoomExact
    )

    for (const { geometry, taskCount } of declutteredClusters) {
      features.push({
        type: 'Feature',
        geometry,
        properties: {
          point_count: taskCount,
          point_count_abbreviated:
            taskCount >= 1000 ? `${Math.round(taskCount / 1000)}k` : String(taskCount),
        },
      })
    }

    if (cluster && clusteredIndex) {
      const clusters = clusteredIndex.getClusters(mapBounds, mapZoom)

      for (const c of clusters) {
        if ((c.properties as ClusterProperties & { cluster: true }).cluster) {
          const clusterProps = c.properties as ClusterProperties & {
            cluster: true
            cluster_id: number
            point_count: number
          }
          const count = clusterProps.totalCount || clusterProps.point_count
          features.push({
            type: 'Feature',
            geometry: c.geometry,
            properties: {
              cluster: true,
              cluster_id: clusterProps.cluster_id,
              point_count: count,
              point_count_abbreviated:
                count >= 1000 ? `${Math.round(count / 1000)}k` : String(count),
            },
          })
          continue
        }

        const pointProps = c.properties as PointProperties
        if (pointProps.id != null && spideredMarkers.has(pointProps.id)) continue

        const typeKey =
          pointProps.challenge_id != null
            ? (challengeTypeMap.get(pointProps.challenge_id) ?? null)
            : null

        features.push({
          type: 'Feature',
          geometry: c.geometry,
          properties: {
            id: pointProps.id,
            status: pointProps.status ?? 0,
            priority: pointProps.priority ?? 0,
            isOverlapping: pointProps.isOverlapping ?? false,
            overlapTaskCount: pointProps.overlapTaskCount,
            task_ids_str: pointProps.task_ids_str,
            group_type: pointProps.group_type,
            task_count: pointProps.task_count,
            challenge_id: pointProps.challenge_id,
            // Only include typeKey when we actually resolved one. Setting it to
            // undefined still leaves the property present after GeoJSON
            // serialization, so MapLibre's `['has', 'typeKey']` branch fires
            // and produces icon names like `marker-type--0` (no icon registered).
            ...(typeKey ? { typeKey } : {}),
          },
        })
      }
    } else {
      // Cluster toggle off — emit each point feature as an individual marker.
      for (const p of pointFeatures) {
        const props = p.properties
        if (props.id != null && spideredMarkers.has(props.id)) continue

        const typeKey =
          props.challenge_id != null ? (challengeTypeMap.get(props.challenge_id) ?? null) : null

        features.push({
          type: 'Feature',
          geometry: p.geometry,
          properties: {
            id: props.id,
            status: props.status ?? 0,
            priority: props.priority ?? 0,
            isOverlapping: props.isOverlapping ?? false,
            overlapTaskCount: props.overlapTaskCount,
            task_ids_str: props.task_ids_str,
            group_type: props.group_type,
            task_count: props.task_count,
            challenge_id: props.challenge_id,
            ...(typeKey ? { typeKey } : {}),
          },
        })
      }
    }

    return { type: 'FeatureCollection', features }
  }, [
    cluster,
    clusteredIndex,
    pointFeatures,
    backendClusterFeatures,
    mapBounds,
    mapZoom,
    mapZoomExact,
    spideredMarkers,
    challengeTypeMap,
  ])

  const handleMapMove = useCallback(() => {
    if (!mapRef.current) return
    const map = mapRef.current.getMap()
    if (!map) return
    const currentZoom = Math.floor(map.getZoom())
    if (currentZoom !== zoom) {
      setZoom(currentZoom)
    }
  }, [setZoom, mapRef, zoom])

  const handleMapMoveEnd = useCallback(() => {
    if (!mapRef.current) return
    const map = mapRef.current.getMap()
    if (!map) return

    if (boundsUpdateTimeoutRef.current) clearTimeout(boundsUpdateTimeoutRef.current)

    boundsUpdateTimeoutRef.current = setTimeout(() => {
      const boundsString = getMapBoundsString(map)

      if (!bounds || !boundsAreEqual(boundsString, bounds)) {
        setBounds(boundsString)
      }
    }, 300)
  }, [setBounds, mapRef, bounds])

  const handleMapClick = useCallback(async (e: MapMouseEvent) => {
    if (!e.features || e.features.length === 0) {
      setSpideredMarkers(new Map())
      setSpideredTaskData([])
      setSelectedTask(null)
      setPendingOverlap(null)
      return
    }

    const feature = e.features[0]
    if (!feature) {
      setSpideredMarkers(new Map())
      setSpideredTaskData([])
      setSelectedTask(null)
      setPendingOverlap(null)
      return
    }

    if (!mapRef.current) return
    const map = mapRef.current.getMap()
    if (!map) return

    if (
      feature.layer?.id === 'spidered-markers-layer' &&
      feature.properties?.id !== undefined &&
      feature.geometry.type === 'Point'
    ) {
      const taskId = feature.properties.id as number
      const coords = feature.geometry.coordinates as [number, number]
      const typeKey = (feature.properties.typeKey as TaskTypeKey | undefined) ?? null
      setSelectedTask({
        id: taskId,
        location: { lng: coords[0], lat: coords[1] },
        status: (feature.properties.status as number) ?? 0,
        priority: (feature.properties.priority as number) ?? 0,
        ...(typeKey ? { typeKey } : {}),
      } as TaskMarker & { typeKey?: TaskTypeKey | null })
      setPendingOverlap(null)
      return
    }

    const isClusterFeature =
      feature.properties?.cluster_id !== undefined || feature.properties?.point_count !== undefined

    if (isClusterFeature && feature.geometry.type === 'Point') {
      const coordinates = feature.geometry.coordinates as [number, number]
      const clusterId = feature.properties.cluster_id as number | undefined
      flyToClusterExpansion(map, superclusterRef.current, clusterId, coordinates)
      setSpideredMarkers(new Map())
      setSpideredTaskData([])
      setPendingOverlap(null)
      return
    }

    if (
      LAYER_IDS.allPoints.includes(feature.layer?.id ?? '') &&
      feature.properties?.isOverlapping === true &&
      feature.geometry.type === 'Point'
    ) {
      const taskIdsStr = feature.properties?.task_ids_str as string | undefined
      if (taskIdsStr) {
        const taskIds = taskIdsStr.split(',').map(Number)
        const coords = feature.geometry.coordinates as [number, number]
        const tasks: TaskMarker[] = taskIds.map((id) => ({
          id,
          location: { lng: coords[0], lat: coords[1] },
          status: 0,
          priority: 0,
        }))
        const spiderGroup = createSpiderGroup(tasks, coords, map)
        setSpideredMarkers(spiderGroup)
        setSpideredTaskData(tasks)
        setSelectedTask(null)
        setPendingOverlap({ taskIds, coords })
      }
      return
    }

    if (
      LAYER_IDS.allPoints.includes(feature.layer?.id ?? '') &&
      feature.properties?.id !== undefined &&
      feature.geometry.type === 'Point'
    ) {
      const clickPoint = e.point
      const visuallyOverlapping = detectVisualOverlaps(map, clickPoint, LAYER_IDS.allPoints, 15)

      if (visuallyOverlapping.length > 1) {
        const coordinates: [number, number] = [e.lngLat.lng, e.lngLat.lat]
        const spiderGroup = createSpiderGroup(visuallyOverlapping, coordinates, map)
        setSpideredMarkers(spiderGroup)
        setSpideredTaskData(visuallyOverlapping)
        setSelectedTask(null)
        setPendingOverlap(null)
        return
      }

      const taskId = feature.properties.id as number
      const coords = feature.geometry.coordinates as [number, number]
      const typeKey = (feature.properties.typeKey as TaskTypeKey | undefined) ?? null
      setSpideredMarkers(new Map())
      setSpideredTaskData([])
      setSelectedTask({
        id: taskId,
        location: { lng: coords[0], lat: coords[1] },
        status: (feature.properties.status as number) ?? 0,
        priority: (feature.properties.priority as number) ?? 0,
        ...(typeKey ? { typeKey } : {}),
      } as TaskMarker & { typeKey?: TaskTypeKey | null })
      setPendingOverlap(null)
      return
    }

    setSpideredMarkers(new Map())
    setSpideredTaskData([])
    setSelectedTask(null)
    setPendingOverlap(null)
  }, [])

  const { data: overlapTasksData } = api.task.getTasks(pendingOverlap?.taskIds ?? [])

  useEffect(() => {
    if (!pendingOverlap || !overlapTasksData) return
    const tasksById = new Map(overlapTasksData.map((t) => [t.id, t]))
    setSpideredTaskData((prev) =>
      prev.map((m) => {
        const t = tasksById.get(m.id)
        return t ? { ...m, status: t.status ?? m.status, priority: t.priority ?? m.priority } : m
      })
    )
  }, [pendingOverlap, overlapTasksData])

  const handleMapMouseMove = useCallback((e: MapMouseEvent) => {
    if (!mapRef.current) return
    const map = mapRef.current.getMap()
    if (!map) return

    const layersToQuery: string[] = []
    if (map.getLayer(LAYER_IDS.clusters)) layersToQuery.push(LAYER_IDS.clusters)
    if (map.getLayer(LAYER_IDS.clusterCount)) layersToQuery.push(LAYER_IDS.clusterCount)
    for (const id of LAYER_IDS.allPoints) {
      if (map.getLayer(id)) layersToQuery.push(id)
    }
    if (map.getLayer('spidered-markers-layer')) layersToQuery.push('spidered-markers-layer')

    if (layersToQuery.length === 0) {
      map.getCanvas().style.cursor = ''
      return
    }

    const features = map.queryRenderedFeatures(e.point, { layers: layersToQuery })

    if (features && features.length > 0) {
      const f = features[0]
      const isCluster =
        f.properties?.cluster_id !== undefined || f.properties?.point_count !== undefined
      const isMarker =
        LAYER_IDS.allPoints.includes(f.layer?.id ?? '') ||
        f.layer?.id === LAYER_IDS.clusters ||
        f.layer?.id === LAYER_IDS.clusterCount ||
        f.layer?.id === 'spidered-markers-layer'

      if (isCluster || isMarker) {
        map.getCanvas().style.cursor = 'pointer'
      } else {
        map.getCanvas().style.cursor = ''
      }
    } else {
      map.getCanvas().style.cursor = ''
    }
  }, [])

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
    tileUrl,
    selectedTaskGeoJSON,
    clusteredGeoJSONData,
    handleMapMove,
    handleMapMoveEnd,
    handleMapClick,
    handleMapMouseMove,
    setCluster,
    locationGeojson,
    spideredMarkers,
    spideredTaskData,
    setSpideredMarkers,
    setSpideredTaskData,
    zoom,
  }
}
