import type { MapLayerMouseEvent } from 'maplibre-gl'
import { useEffect, useId, useMemo } from 'react'
import { Layer, Source, useMap } from 'react-map-gl/maplibre'
import { clusterCountLayer, clusterLayer } from '@/components/Map/TaskMarkers/clusterLayers'
import type { ClusterMarkerFeature } from '@/components/Map/TaskMarkers/clusterUtils'

const ZOOM_STEP = 2
const FLY_DURATION_MS = 600

/**
 * Renders the pre-clustered task data the backend serves below z12.
 */
export const BackendClusterLayer = ({ clusters }: { clusters: ClusterMarkerFeature[] }) => {
  const { current: mapRef } = useMap()
  const sourceId = useId()
  const circlesLayerId = `${sourceId}-clusters`
  const countLayerId = `${sourceId}-cluster-count`

  const data = useMemo(
    (): GeoJSON.FeatureCollection<GeoJSON.Point> => ({
      type: 'FeatureCollection',
      features: clusters.map(({ geometry, taskCount }) => ({
        type: 'Feature',
        geometry,
        properties: { point_count: taskCount },
      })),
    }),
    [clusters]
  )

  useEffect(() => {
    const map = mapRef?.getMap()
    if (!map) return

    const onClick = (e: MapLayerMouseEvent) => {
      const geometry = e.features?.[0]?.geometry
      if (geometry?.type !== 'Point') return
      map.flyTo({
        center: geometry.coordinates as [number, number],
        zoom: Math.min(map.getZoom() + ZOOM_STEP, map.getMaxZoom()),
        duration: FLY_DURATION_MS,
      })
    }
    const onEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const onLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', circlesLayerId, onClick)
    map.on('mouseenter', circlesLayerId, onEnter)
    map.on('mouseleave', circlesLayerId, onLeave)
    return () => {
      map.off('click', circlesLayerId, onClick)
      map.off('mouseenter', circlesLayerId, onEnter)
      map.off('mouseleave', circlesLayerId, onLeave)
    }
  }, [mapRef, circlesLayerId])

  return (
    <Source id={sourceId} type="geojson" data={data}>
      <Layer {...clusterLayer} id={circlesLayerId} />
      <Layer {...clusterCountLayer} id={countLayerId} />
    </Source>
  )
}
