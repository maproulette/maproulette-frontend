import bbox from '@turf/bbox'
import { Maximize2 } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MapMouseEvent, MapRef } from 'react-map-gl/maplibre'
import { Map as MapGL } from 'react-map-gl/maplibre'
import Supercluster from 'supercluster'
import { cn } from '@/lib/utils'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapControls } from '@/components/Map/MapControls'
import { getCurrentMapStyle } from '@/components/Map/mapStyles'
import { mapBoundsToBbox } from '@/components/Map/mapUtils'
import { ClusterSource } from '@/components/Map/TaskMarkers/ClusterSource'
import { ClusterToggle } from '@/components/Map/TaskMarkers/ClusterToggle'
import { flyToClusterExpansion } from '@/components/Map/TaskMarkers/clusterUtils'
import { CLUSTER_RADIUS_PX, LAYER_IDS } from '@/components/Map/TaskMarkers/const'
import { createMarkerIcons } from '@/components/Map/TaskMarkers/createMarkerIcons'
import { SpiderMarkers } from '@/components/Map/TaskMarkers/SpiderMarkers'
import { createSpiderGroup, detectVisualOverlaps } from '@/components/Map/TaskMarkers/spiderUtils'
import { TaskGeometryLayer } from '@/components/Map/TaskMarkers/TaskGeometryLayer'
import {
  buildSelectedTaskCollection,
  convertTaskMarkersToGeoJSON,
} from '@/components/Map/TaskMarkers/utils'
import { MapLoadingIndicator } from '@/components/shared/MapLoadingIndicator'
import { useDrawerPortal } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { TaskInfoDrawer } from '@/components/TaskInfoPanel/TaskInfoDrawer'
import { useIntl } from '@/i18n'
import type { Bbox2D } from '@/types/Map'
import type { TaskMarker } from '@/types/Task'

interface MiniChallengeMapProps {
  markers: TaskMarker[]
  isLoading: boolean
  containerClassName?: string
  onBoundsStringChange?: (bounds: string) => void
  selectedTask?: TaskMarker | null
  onSelectTask?: (task: TaskMarker | null) => void
}

interface PointProperties {
  cluster?: false
  id: number
  status: number
  priority: number
}

interface ClusterProperties {
  cluster: true
  cluster_id: number
  point_count: number
  point_count_abbreviated: string
}

const BOUNDS_DEBOUNCE_MS = 400

export const MiniChallengeMap = ({
  markers,
  isLoading,
  containerClassName = 'h-52 w-full',
  onBoundsStringChange,
  selectedTask = null,
  onSelectTask,
}: MiniChallengeMapProps) => {
  const { t } = useIntl()
  const mapId = useId()
  const mapRef = useRef<MapRef | null>(null)
  const boundsDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const superclusterRef = useRef<Supercluster<PointProperties, ClusterProperties> | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [cluster, setCluster] = useState(true)
  const [mapZoom, setMapZoom] = useState(2)
  const [mapBounds, setMapBounds] = useState<Bbox2D>([-180, -85, 180, 85])
  const [iconsVersion, setIconsVersion] = useState(0)
  // Use internal state only if no external control is provided
  const [internalSelectedTask, setInternalSelectedTask] = useState<TaskMarker | null>(null)
  const activeSelectedTask = onSelectTask ? selectedTask : internalSelectedTask
  const setSelectedTask = onSelectTask ?? setInternalSelectedTask
  const [spideredMarkers, setSpideredMarkers] = useState<
    Map<number, { original: [number, number]; spidered: [number, number] }>
  >(new Map())
  const initialBoundsAppliedRef = useRef(false)
  const { portalTarget } = useDrawerPortal()

  // Reason: converts marker data to GeoJSON format - avoids rebuilding feature collection on every render
  const geoJSONData = useMemo(() => {
    if (markers.length > 0) {
      return convertTaskMarkersToGeoJSON(markers)
    }
    return { type: 'FeatureCollection', features: [] } as GeoJSON.FeatureCollection
  }, [markers])

  // Deliberately does NOT depend on the selected task: the selected marker is
  // drawn by a separate 1-feature overlay (selectedTaskData below), so selecting
  // a marker never re-runs the supercluster pipeline.
  const pointFeatures = useMemo(() => {
    return geoJSONData.features
      .filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f.geometry.type === 'Point')
      .map((feature) => {
        return {
          type: 'Feature' as const,
          geometry: feature.geometry,
          properties: {
            cluster: false as const,
            id: feature.properties?.id as number,
            status: feature.properties?.status as number,
            priority: feature.properties?.priority as number,
          },
        }
      })
  }, [geoJSONData])

  // Track map viewport
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current.getMap()
    if (!map) return

    const updateViewport = () => {
      setMapZoom(Math.floor(map.getZoom()))
      setMapBounds(mapBoundsToBbox(map.getBounds()))
    }
    updateViewport()
    map.on('move', updateViewport)
    map.on('moveend', updateViewport)
    return () => {
      map.off('move', updateViewport)
      map.off('moveend', updateViewport)
    }
  }, [mapLoaded])

  // Reason: builds Supercluster spatial indices - expensive initialization should only run when features change
  const { clusteredIndex, unclusteredIndex } = useMemo(() => {
    if (pointFeatures.length === 0) {
      return { clusteredIndex: null, unclusteredIndex: null }
    }
    const opts = { maxZoom: 16, minZoom: 0 }
    const clustered = new Supercluster<PointProperties, ClusterProperties>({
      ...opts,
      radius: CLUSTER_RADIUS_PX,
    })
    clustered.load(pointFeatures)
    const unclustered = new Supercluster<PointProperties, ClusterProperties>({ ...opts, radius: 0 })
    unclustered.load(pointFeatures)
    return { clusteredIndex: clustered, unclusteredIndex: unclustered }
  }, [pointFeatures])

  const isClusteringForced = mapZoom < 2
  // Reason: selects the active Supercluster index based on cluster toggle state
  const superclusterIndex = useMemo(() => {
    const idx = cluster || isClusteringForced ? clusteredIndex : unclusteredIndex
    superclusterRef.current = idx
    return idx
  }, [clusteredIndex, unclusteredIndex, cluster, isClusteringForced])

  // Reason: queries Supercluster for visible clusters/points in current viewport - avoids requery on every render
  const clusteredGeoJSONData = useMemo((): GeoJSON.FeatureCollection => {
    if (!superclusterIndex) return { type: 'FeatureCollection', features: [] }
    const effectiveZoom = mapZoom < 2 ? 0 : mapZoom
    const clusters = superclusterIndex.getClusters(mapBounds, effectiveZoom)

    const features = clusters
      .filter((c) => {
        if ('cluster_id' in c.properties && 'point_count' in c.properties) return true
        return !spideredMarkers.has((c.properties as PointProperties).id)
      })
      .map((c) => {
        const isCluster = 'cluster_id' in c.properties && 'point_count' in c.properties
        if (isCluster) {
          const props = c.properties as ClusterProperties
          return {
            type: 'Feature' as const,
            geometry: c.geometry,
            properties: {
              cluster: true,
              cluster_id: props.cluster_id,
              point_count: props.point_count,
              point_count_abbreviated:
                props.point_count >= 1000
                  ? `${Math.round(props.point_count / 1000)}k`
                  : String(props.point_count),
            },
          }
        }
        const pp = c.properties as PointProperties
        return {
          type: 'Feature' as const,
          geometry: c.geometry,
          properties: {
            id: pp.id,
            status: pp.status,
            priority: pp.priority,
          },
        }
      })

    return { type: 'FeatureCollection', features }
  }, [superclusterIndex, mapBounds, mapZoom, iconsVersion, spideredMarkers])

  // Build the selected-task overlay directly from the selected marker (a cheap
  // 1-feature collection) so selecting a marker never re-runs the supercluster
  // pipeline. Drawn on top at 1.4x via the shared selected overlay. When the
  // marker is spidered, SpiderMarkers draws it instead.
  const selectedTaskData = useMemo(
    () => buildSelectedTaskCollection(activeSelectedTask, spideredMarkers),
    [activeSelectedTask, spideredMarkers]
  )

  // Create marker icons
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return
    const map = mapRef.current.getMap()
    if (!map) return
    createMarkerIcons({ current: map }, () => {
      map.triggerRepaint()
      setIconsVersion((v) => v + 1)
    })
  }, [mapLoaded, cluster])

  // Reason: computes bounding box from all task coordinates - avoids iterating features on every render
  const allTagsBounds = useMemo<Bbox2D | null>(() => {
    if (!geoJSONData || geoJSONData.features.length === 0) return null
    return bbox(geoJSONData) as Bbox2D
  }, [geoJSONData])

  // Reason: stable reference for debounced bounds reporter used as map moveend handler
  const scheduleBoundsReport = useCallback(() => {
    if (!onBoundsStringChange) return
    if (boundsDebounceRef.current) clearTimeout(boundsDebounceRef.current)
    boundsDebounceRef.current = setTimeout(() => {
      boundsDebounceRef.current = null
      const map = mapRef.current?.getMap()
      if (!map) return
      const b = map.getBounds()
      onBoundsStringChange(`${b.getWest()},${b.getSouth()},${b.getEast()},${b.getNorth()}`)
    }, BOUNDS_DEBOUNCE_MS)
  }, [onBoundsStringChange])

  useEffect(() => {
    return () => {
      if (boundsDebounceRef.current) clearTimeout(boundsDebounceRef.current)
    }
  }, [])

  // Fit to task bounds the first time markers are available. If the challenge
  // is still building, allTagsBounds is null and we defer until the refresh
  // poll brings in real markers.
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || initialBoundsAppliedRef.current) return
    if (isLoading) return
    if (!allTagsBounds) return
    const map = mapRef.current.getMap()
    if (!map) return

    map.fitBounds(allTagsBounds, { padding: 50, duration: 0, maxZoom: 16 })
    initialBoundsAppliedRef.current = true
    scheduleBoundsReport()
  }, [mapLoaded, allTagsBounds, isLoading, scheduleBoundsReport])

  // Reason: stable reference for zoom-to-all button click handler
  const zoomToAllTags = useCallback(() => {
    if (!mapRef.current || !allTagsBounds) return
    const map = mapRef.current.getMap()
    if (!map) return
    map.fitBounds(allTagsBounds, { padding: 50, duration: 1000, maxZoom: 16 })
  }, [allTagsBounds])

  // Reason: stable reference for map click handler - avoids re-bindng event listener on every render
  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (!e.features || e.features.length === 0) {
        setSpideredMarkers(new Map())
        setSelectedTask(null)
        return
      }
      const feature = e.features[0]
      if (!feature || !mapRef.current) return
      const map = mapRef.current.getMap()
      if (!map) return

      // Spidered marker click
      if (feature.layer?.id === 'spidered-markers-layer' && feature.properties?.id !== undefined) {
        const taskId = feature.properties.id as number
        const task = markers.find((m) => m.id === taskId)
        if (task) setSelectedTask(task)
        return
      }

      // Cluster click -> zoom in
      const isClusterFeature =
        feature.properties?.cluster_id !== undefined ||
        feature.properties?.point_count !== undefined
      if (isClusterFeature && feature.geometry.type === 'Point') {
        const coords = feature.geometry.coordinates as [number, number]
        const clusterId = feature.properties.cluster_id as number | undefined
        flyToClusterExpansion(map, superclusterRef.current, clusterId, coords)
        setSpideredMarkers(new Map())
        return
      }

      // Unclustered point click -> detect overlaps and spider, or select task
      const isUnclusteredPoint =
        LAYER_IDS.allPoints.includes(feature.layer?.id ?? '') &&
        feature.properties?.id !== undefined &&
        feature.geometry.type === 'Point'
      if (isUnclusteredPoint) {
        const overlaps = detectVisualOverlaps(map, e.point, LAYER_IDS.allPoints, 15)
        if (overlaps.length > 1) {
          const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat]
          setSpideredMarkers(createSpiderGroup(overlaps, coords, map))
          setSelectedTask(null)
          return
        }
        // Single marker - show task info drawer
        const taskId = feature.properties?.id as number
        const task = markers.find((m) => m.id === taskId)
        if (task) {
          setSpideredMarkers(new Map())
          setSelectedTask(task)
        }
      }
    },
    [markers]
  )

  // Reason: stable reference for mouse move handler - avoids re-binding event listener on every render
  const handleMapMouseMove = useCallback((e: MapMouseEvent) => {
    if (!mapRef.current) return
    const map = mapRef.current.getMap()
    if (!map) return

    const layers: string[] = []
    if (map.getLayer(LAYER_IDS.clusters)) layers.push(LAYER_IDS.clusters)
    if (map.getLayer(LAYER_IDS.clusterCount)) layers.push(LAYER_IDS.clusterCount)
    for (const id of LAYER_IDS.allPoints) {
      if (map.getLayer(id)) layers.push(id)
    }
    if (map.getLayer('spidered-markers-layer')) layers.push('spidered-markers-layer')

    if (layers.length === 0) {
      map.getCanvas().style.cursor = ''
      return
    }
    const features = map.queryRenderedFeatures(e.point, { layers })
    map.getCanvas().style.cursor = features && features.length > 0 ? 'pointer' : ''
  }, [])

  const shouldCluster = cluster

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border border-zinc-200 dark:border-slate-700',
        containerClassName
      )}
    >
      <div className="absolute inset-0">
        <MapGL
          id={mapId}
          ref={mapRef}
          initialViewState={{ longitude: 0, latitude: 0, zoom: 1.5 }}
          mapStyle={getCurrentMapStyle()}
          style={{ width: '100%', height: '100%' }}
          onLoad={() => setMapLoaded(true)}
          onMoveEnd={onBoundsStringChange ? scheduleBoundsReport : undefined}
          onClick={handleMapClick}
          onMouseMove={handleMapMouseMove}
          attributionControl={false}
          dragRotate={false}
          touchPitch={false}
          interactiveLayerIds={
            shouldCluster
              ? [
                  LAYER_IDS.clusters,
                  LAYER_IDS.clusterCount,
                  ...LAYER_IDS.allPoints,
                  'spidered-markers-layer',
                ]
              : [...LAYER_IDS.allPoints, 'spidered-markers-layer']
          }
        >
          <TaskGeometryLayer selectedTaskId={activeSelectedTask?.id ?? null} />

          <ClusterSource clusteredData={clusteredGeoJSONData} selectedTaskData={selectedTaskData} />

          {spideredMarkers.size > 0 && (
            <SpiderMarkers
              markers={markers.filter((m) => spideredMarkers.has(m.id))}
              spiderPositions={spideredMarkers}
              selectedTaskId={activeSelectedTask?.id}
            />
          )}
        </MapGL>
      </div>

      <MapLoadingIndicator isLoading={isLoading} />

      <MapControls
        map={mapRef}
        mapLoaded={mapLoaded}
        showZoom={true}
        showReset={true}
        showLayers={true}
        collapsible={true}
        defaultOpen={true}
        customButtons={
          allTagsBounds
            ? [
                {
                  icon: Maximize2,
                  onClick: zoomToAllTags,
                  tooltip: t(
                    'manageChallengeDetail.miniMap.zoomToAllTasksTooltip',
                    undefined,
                    'Zoom to all tasks'
                  ),
                  disabled: !mapLoaded,
                },
              ]
            : []
        }
      />

      <ClusterToggle clusteringEnabled={shouldCluster} onToggle={setCluster} />

      {portalTarget &&
        createPortal(
          <TaskInfoDrawer
            selectedTask={activeSelectedTask}
            onClose={() => {
              setSelectedTask(null)
              setSpideredMarkers(new Map())
            }}
            mapRef={mapRef}
          />,
          portalTarget
        )}
    </div>
  )
}
