import { useId } from 'react'
import { createPortal } from 'react-dom'
import { Layer, Source } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useDirectionsToggle } from '@/components/Map/directionsControlButton'
import { MapControls } from '@/components/Map/MapControls'
import { MapGL } from '@/components/Map/MapGL'
import { getCurrentMapStyle } from '@/components/Map/mapStyles'
import { ScaleBar } from '@/components/Map/ScaleBar'
import { StatusLegend } from '@/components/Map/StatusLegend'
import { ClusterSource } from '@/components/Map/TaskMarkers/ClusterSource'
import { ClusterToggle } from '@/components/Map/TaskMarkers/ClusterToggle'
import { LAYER_IDS } from '@/components/Map/TaskMarkers/const'
import { TaskGeometryLayer } from '@/components/Map/TaskMarkers/TaskGeometryLayer'
import { TaskPickerMenu } from '@/components/Map/TaskMarkers/TaskPickerMenu'
import { MapLoadingIndicator } from '@/components/shared/MapLoadingIndicator'
import { useDrawerPortal } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { TaskInfoDrawer } from '@/components/TaskInfoPanel/TaskInfoDrawer'
import { useExploreChallengesMap } from './hooks'
import { LocationIndicator } from './LocationIndicator'
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
    picker,
    selectPickedTask,
    closePicker,
  } = useExploreChallengesMap()
  const { showDirections, directionsButton } = useDirectionsToggle(mapLoaded)

  const mvtSourceId = 'mvt-data'
  const mvtLayerId = 'mvt-hidden'

  const { portalTarget } = useDrawerPortal()

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
          onClick={handleMapClick}
          onMouseMove={handleMapMouseMove}
          interactiveLayerIds={[LAYER_IDS.clusters, LAYER_IDS.clusterCount, ...LAYER_IDS.allPoints]}
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

          <TaskGeometryLayer
            selectedTaskId={selectedTask?.id ?? null}
            showDirections={showDirections}
          />

          {/* Visible clustered markers via Supercluster, with the selected task
              drawn on top via the shared selected overlay. */}
          <ClusterSource
            clusteredData={clusteredGeoJSONData}
            selectedTaskData={selectedTaskGeoJSON}
          />

          {picker && (
            <TaskPickerMenu picker={picker} onSelect={selectPickedTask} onClose={closePicker} />
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
            onClose={() => setSelectedTask(null)}
            mapRef={mapRef}
          />,
          portalTarget
        )}

      <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
        <ClusterToggle clusteringEnabled={cluster} onToggle={setCluster} inline />
        <LocationIndicator />
      </div>

      <MapControls
        map={mapRef}
        mapLoaded={mapLoaded}
        showZoom={true}
        showReset={true}
        showLayers={true}
        collapsible={true}
        defaultOpen={true}
        customButtons={[directionsButton]}
      />
    </div>
  )
}
