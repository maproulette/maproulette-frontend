import bbox from '@turf/bbox'
import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { MapMouseEvent } from 'react-map-gl/maplibre'
import { Layer, Map as MapGL, Source } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapControls } from '@/components/Map/MapControls'
import { getCurrentMapStyle } from '@/components/Map/mapStyles'
import { ScaleBar } from '@/components/Map/ScaleBar'
import { StatusLegend } from '@/components/Map/StatusLegend'
import { ClusterSource } from '@/components/Map/TaskMarkers/ClusterSource'
import { ClusterToggle } from '@/components/Map/TaskMarkers/ClusterToggle'
import { clusterLayer } from '@/components/Map/TaskMarkers/clusterLayers'
import { LAYER_IDS } from '@/components/Map/TaskMarkers/const'
import { SpiderMarkers } from '@/components/Map/TaskMarkers/SpiderMarkers'
import { TaskGeometryLayer } from '@/components/Map/TaskMarkers/TaskGeometryLayer'
import { MapLoadingIndicator } from '@/components/shared/MapLoadingIndicator'
import { useDrawerPortal } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { TaskInfoDrawer } from '@/components/TaskInfoPanel/TaskInfoDrawer'
import type { Bbox2D } from '@/types/Map'
import { useExploreChallengesMap } from './hooks'
import { LocationPolygonLayer } from './LocationPolygonLayer'

export const ExploreChallengesMap = () => {
  const mapId = useId()
  const {
    mapRef,
    mapLoaded,
    setMapLoaded,
    isLoadingMarkers,
    selectedTask,
    setSelectedTask,
    tileUrl,
    selectedTaskGeoJSON,
    clusteredGeoJSONData,
    cluster,
    setCluster,
    handleMapMove,
    handleMapMoveEnd,
    handleMapClick,
    handleMapMouseMove,
    locationGeojson,
    spideredMarkers,
    spideredTaskData,
    setSpideredMarkers,
    setSpideredTaskData,
  } = useExploreChallengesMap()

  const mvtSourceId = 'mvt-data'
  const mvtLayerId = 'mvt-hidden'

  const { portalTarget } = useDrawerPortal()

  const hasInitializedRef = useRef(false)
  const previousLocationGeojsonRef = useRef<typeof locationGeojson>(null)

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true
      previousLocationGeojsonRef.current = locationGeojson
      return
    }

    if (previousLocationGeojsonRef.current === locationGeojson || !locationGeojson) {
      previousLocationGeojsonRef.current = locationGeojson
      return
    }

    if (
      previousLocationGeojsonRef.current === null &&
      locationGeojson !== null &&
      window.location.hash.length > 1
    ) {
      // Skip fitting to task geometry if the map camera state has already
      // been set (either by interaction or from the URL hash)
      previousLocationGeojsonRef.current = locationGeojson
      return
    }

    const map = mapRef.current.getMap()
    if (!map) return

    if (locationGeojson) {
      map.fitBounds(bbox(locationGeojson) as Bbox2D, {
        padding: 50,
        duration: 1000,
        maxZoom: 18,
      })
    }

    previousLocationGeojsonRef.current = locationGeojson
  }, [locationGeojson, mapLoaded, mapRef])

  return (
    <div className="relative isolate h-full w-full">
      <div className="absolute inset-0 overflow-hidden rounded-lg">
        <MapGL
          id={mapId}
          ref={mapRef}
          hash
          initialViewState={{
            longitude: 0,
            latitude: 0,
            zoom: 2,
          }}
          mapStyle={getCurrentMapStyle()}
          onLoad={() => setMapLoaded(true)}
          onMove={handleMapMove}
          onMoveEnd={handleMapMoveEnd}
          onClick={(e: MapMouseEvent) => {
            handleMapClick(e)
          }}
          onMouseMove={handleMapMouseMove}
          interactiveLayerIds={
            clusterLayer.id
              ? [
                  clusterLayer.id,
                  LAYER_IDS.clusterCount,
                  ...LAYER_IDS.allPoints,
                  'spidered-markers-layer',
                ]
              : [...LAYER_IDS.allPoints, 'spidered-markers-layer']
          }
        >
          <LocationPolygonLayer locationGeojson={locationGeojson} />

          {/* Hidden MVT source for efficient tile data fetching */}
          {/* key forces remount when URL changes so MapLibre re-fetches tiles */}
          <Source key={tileUrl} id={mvtSourceId} type="vector" tiles={[tileUrl]} maxzoom={12}>
            <Layer
              id={mvtLayerId}
              type="circle"
              source-layer="default"
              paint={{ 'circle-radius': 0, 'circle-opacity': 0 }}
            />
          </Source>

          {/* Visible clustered markers via Supercluster, with the selected task
              drawn on top via the shared selected overlay. */}
          <ClusterSource
            clusteredData={clusteredGeoJSONData}
            selectedTaskData={selectedTaskGeoJSON}
          />

          <TaskGeometryLayer selectedTaskId={selectedTask?.id ?? null} />

          {spideredMarkers.size > 0 && (
            <SpiderMarkers
              markers={spideredTaskData}
              spiderPositions={spideredMarkers}
              selectedTaskId={selectedTask?.id}
            />
          )}
        </MapGL>

        <MapLoadingIndicator isLoading={isLoadingMarkers} centered />

        <div className="absolute bottom-2 left-2 z-10 flex items-end gap-2">
          <StatusLegend />
          <ScaleBar mapRef={mapRef} mapLoaded={mapLoaded} />
        </div>
      </div>

      {portalTarget &&
        createPortal(
          <TaskInfoDrawer
            selectedTask={selectedTask}
            onClose={() => {
              setSelectedTask(null)
              setSpideredMarkers(new Map())
              setSpideredTaskData([])
            }}
            mapRef={mapRef}
          />,
          portalTarget
        )}

      <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
        <ClusterToggle clusteringEnabled={cluster} onToggle={setCluster} inline />
      </div>

      <MapControls
        map={mapRef}
        mapLoaded={mapLoaded}
        showZoom={true}
        showReset={true}
        showLayers={true}
        collapsible={true}
        defaultOpen={true}
      />
    </div>
  )
}
