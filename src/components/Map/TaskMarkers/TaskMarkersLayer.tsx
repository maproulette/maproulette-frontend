import type {
  FilterSpecification,
  GeoJSONSource,
  MapGeoJSONFeature,
  MapMouseEvent,
  SymbolLayerSpecification,
} from 'maplibre-gl'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'
import { clusterCountLayer, clusterLayer } from '@/components/Map/TaskMarkers/clusterLayers'
import { clusterRadiusForCount } from '@/components/Map/TaskMarkers/clusterUtils'
import { CLUSTER_RADIUS_PX } from '@/components/Map/TaskMarkers/const'
import {
  type HighlightedMarker,
  type MarkerStyle,
  statusPinStyle,
} from '@/components/Map/TaskMarkers/markerStyle'
import {
  circleExtent,
  pinExtent,
  TaskPickerMenu,
  type TaskPickerState,
} from '@/components/Map/TaskMarkers/TaskPickerMenu'
import { useTaskMarkerResources } from '@/components/Map/TaskMarkers/useTaskMarkerResources'
import { isValidLocation } from '@/components/Map/TaskMarkers/utils'
import type { TaskMarker } from '@/types/Task'

export const CLUSTER_MAX_ZOOM = 16
const PICKER_LIMIT = 100
const SAME_SPOT_DEGREES = 1e-6
const EXPAND_DURATION_MS = 600

const NO_HIGHLIGHTS: HighlightedMarker[] = []

interface TaskMarkersLayerProps {
  markers: TaskMarker[]
  cluster: boolean
  markerStyle?: (marker: TaskMarker) => MarkerStyle
  highlighted?: HighlightedMarker[]
  interactive?: boolean
  onSelectTask: (marker: TaskMarker) => void
  onEmptyClick?: () => void
}

const toFeatures = (
  entries: Array<{ marker: TaskMarker; style: MarkerStyle }>
): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
  type: 'FeatureCollection',
  features: entries
    .filter(({ marker }) => isValidLocation(marker.location))
    .map(({ marker, style }, rank) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [marker.location.lng, marker.location.lat] },
      properties: {
        id: marker.id,
        status: marker.status,
        icon: style.icon,
        opacity: style.opacity,
        size: style.size,
        rank,
      },
    })),
})

const pinLayout: SymbolLayerSpecification['layout'] = {
  'icon-image': ['get', 'icon'],
  'icon-size': ['get', 'size'],
  'icon-anchor': 'bottom',
  'icon-allow-overlap': true,
  'icon-ignore-placement': true,
}

const allAtOneSpot = (features: GeoJSON.Feature[]): boolean => {
  const points = features
    .map((f) => (f.geometry.type === 'Point' ? f.geometry.coordinates : null))
    .filter((c): c is GeoJSON.Position => c !== null)
  const [first] = points
  return (
    first !== undefined &&
    points.every(
      ([lng, lat]) =>
        Math.abs(lng - first[0]) <= SAME_SPOT_DEGREES &&
        Math.abs(lat - first[1]) <= SAME_SPOT_DEGREES
    )
  )
}

export const TaskMarkersLayer = ({
  markers,
  cluster,
  markerStyle = statusPinStyle,
  highlighted = NO_HIGHLIGHTS,
  interactive = true,
  onSelectTask,
  onEmptyClick,
}: TaskMarkersLayerProps) => {
  useTaskMarkerResources()
  const { current: mapRef } = useMap()
  const sourceId = useId()
  const highlightSourceId = useId()
  const clustersLayerId = `${sourceId}-clusters`
  const countLayerId = `${sourceId}-cluster-count`
  const pointsLayerId = `${sourceId}-points`
  const createdLayerId = `${sourceId}-points-created`
  const highlightLayerId = `${highlightSourceId}-pins`

  const [picker, setPicker] = useState<TaskPickerState | null>(null)

  const data = useMemo(
    () => toFeatures(markers.map((marker) => ({ marker, style: markerStyle(marker) }))),
    [markers, markerStyle]
  )
  const highlightData = useMemo(() => toFeatures(highlighted), [highlighted])

  const markersById = useMemo(() => {
    const byId = new Map<number, TaskMarker>()
    for (const marker of markers) byId.set(marker.id, marker)
    for (const { marker } of highlighted) byId.set(marker.id, marker)
    return byId
  }, [markers, highlighted])

  const pointFilters = useMemo((): Record<'points' | 'created', FilterSpecification> => {
    const ids = highlighted.map(({ marker }) => marker.id)
    const notHighlighted: FilterSpecification =
      ids.length > 0 ? ['!', ['in', ['get', 'id'], ['literal', ids]]] : true
    return {
      points: ['all', ['!', ['has', 'point_count']], ['!=', ['get', 'status'], 0], notHighlighted],
      created: ['all', ['!', ['has', 'point_count']], ['==', ['get', 'status'], 0], notHighlighted],
    }
  }, [highlighted])

  const appliedCluster = useRef(cluster)
  useEffect(() => {
    if (appliedCluster.current === cluster) return
    appliedCluster.current = cluster
    const source = mapRef?.getMap().getSource(sourceId) as GeoJSONSource | undefined
    source?.setClusterOptions({ cluster, clusterMaxZoom: CLUSTER_MAX_ZOOM })
  }, [mapRef, sourceId, cluster])

  const latest = useRef({ markersById, onSelectTask, onEmptyClick })
  useEffect(() => {
    latest.current = { markersById, onSelectTask, onEmptyClick }
  }, [markersById, onSelectTask, onEmptyClick])

  const closePicker = useCallback(() => setPicker(null), [])

  const selectFromPicker = useCallback((marker: TaskMarker) => {
    setPicker(null)
    latest.current.onSelectTask(marker)
  }, [])

  useEffect(() => {
    const map = mapRef?.getMap()
    if (!map || !interactive) return

    const layers = [highlightLayerId, createdLayerId, pointsLayerId, clustersLayerId, countLayerId]
    const hitsAt = (point: MapMouseEvent['point']): MapGeoJSONFeature[] => {
      const present = layers.filter((id) => map.getLayer(id))
      return present.length > 0 ? map.queryRenderedFeatures(point, { layers: present }) : []
    }

    const expandCluster = async (feature: MapGeoJSONFeature) => {
      const source = map.getSource(sourceId) as GeoJSONSource | undefined
      if (!source || feature.geometry.type !== 'Point') return
      const center = feature.geometry.coordinates as [number, number]
      const clusterId = feature.properties.cluster_id as number
      const total = feature.properties.point_count as number

      const zoom = await source.getClusterExpansionZoom(clusterId)
      if (zoom > CLUSTER_MAX_ZOOM) {
        const leaves = await source.getClusterLeaves(clusterId, PICKER_LIMIT, 0)
        if (allAtOneSpot(leaves)) {
          const { markersById } = latest.current
          const stacked = leaves
            .map((leaf) => markersById.get(leaf.properties?.id as number))
            .filter((m): m is TaskMarker => m !== undefined)
          setPicker({
            lngLat: center,
            extent: circleExtent(clusterRadiusForCount(total)),
            markers: stacked,
            total,
          })
          return
        }
      }
      map.easeTo({ center, zoom: Math.min(zoom, map.getMaxZoom()), duration: EXPAND_DURATION_MS })
    }

    const onClick = (event: MapMouseEvent) => {
      const hits = hitsAt(event.point)
      const { markersById, onSelectTask, onEmptyClick } = latest.current

      const pinned = [
        ...new Set(
          hits.filter((f) => f.properties.cluster !== true).map((f) => f.properties.id as number)
        ),
      ]
        .map((id) => markersById.get(id))
        .filter((m): m is TaskMarker => m !== undefined)

      if (pinned.length === 1) {
        setPicker(null)
        onSelectTask(pinned[0])
        return
      }
      const topPin = hits.find((f) => f.properties.cluster !== true)
      if (pinned.length > 1 && topPin?.geometry.type === 'Point') {
        setPicker({
          lngLat: topPin.geometry.coordinates as [number, number],
          extent: pinExtent((topPin.properties.size as number | undefined) ?? 1),
          markers: pinned,
          total: pinned.length,
        })
        return
      }

      setPicker(null)
      const clusterHit = hits.find((f) => f.properties.cluster === true)
      if (clusterHit) {
        void expandCluster(clusterHit)
        return
      }
      onEmptyClick?.()
    }

    let pointer = false
    const onMouseMove = (event: MapMouseEvent) => {
      const over = hitsAt(event.point).length > 0
      if (over === pointer) return
      pointer = over
      map.getCanvas().style.cursor = over ? 'pointer' : ''
    }

    map.on('click', onClick)
    map.on('mousemove', onMouseMove)
    return () => {
      map.off('click', onClick)
      map.off('mousemove', onMouseMove)
      if (pointer) map.getCanvas().style.cursor = ''
    }
  }, [
    mapRef,
    interactive,
    sourceId,
    clustersLayerId,
    countLayerId,
    pointsLayerId,
    createdLayerId,
    highlightLayerId,
  ])

  useEffect(() => {
    if (!interactive) setPicker(null)
  }, [interactive])

  return (
    <>
      <Source
        id={sourceId}
        type="geojson"
        data={data}
        cluster={cluster}
        clusterMaxZoom={CLUSTER_MAX_ZOOM}
        clusterRadius={CLUSTER_RADIUS_PX}
      >
        <Layer {...clusterLayer} id={clustersLayerId} />
        <Layer {...clusterCountLayer} id={countLayerId} />
        <Layer
          id={pointsLayerId}
          type="symbol"
          filter={pointFilters.points}
          layout={{ ...pinLayout, 'symbol-z-order': 'viewport-y' }}
          paint={{ 'icon-opacity': ['get', 'opacity'] }}
        />
        <Layer
          id={createdLayerId}
          type="symbol"
          filter={pointFilters.created}
          layout={{ ...pinLayout, 'symbol-z-order': 'viewport-y' }}
          paint={{ 'icon-opacity': ['get', 'opacity'] }}
        />
      </Source>

      <Source id={highlightSourceId} type="geojson" data={highlightData}>
        <Layer
          id={highlightLayerId}
          type="symbol"
          layout={{ ...pinLayout, 'symbol-sort-key': ['get', 'rank'] }}
          paint={{ 'icon-opacity': ['get', 'opacity'] }}
        />
      </Source>

      {picker && (
        <TaskPickerMenu picker={picker} onSelect={selectFromPicker} onClose={closePicker} />
      )}
    </>
  )
}
