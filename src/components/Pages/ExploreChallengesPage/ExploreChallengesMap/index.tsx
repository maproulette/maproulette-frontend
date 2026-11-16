import { useCallback, useId, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Layer, Source } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { DirectionsSetting, useDirectionsToggle } from '@/components/Map/directions'
import { MapControls } from '@/components/Map/MapControls'
import { MapGL } from '@/components/Map/MapGL'
import { MapSettingsSection } from '@/components/Map/MapSettings'
import { getCurrentMapStyle } from '@/components/Map/mapStyles'
import { ScaleBar } from '@/components/Map/ScaleBar'
import { StatusLegend } from '@/components/Map/StatusLegend'
import { ClusterToggle } from '@/components/Map/TaskMarkers/ClusterToggle'
import {
  type HighlightedMarker,
  type MarkerStyle,
  statusPinIcon,
} from '@/components/Map/TaskMarkers/markerStyle'
import { TaskGeometryLayer } from '@/components/Map/TaskMarkers/TaskGeometryLayer'
import { TaskMarkersLayer } from '@/components/Map/TaskMarkers/TaskMarkersLayer'
import { MapLoadingIndicator } from '@/components/shared/MapLoadingIndicator'
import { useDrawerPortal } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { TaskInfoDrawer } from '@/components/TaskInfoPanel/TaskInfoDrawer'
import { useIntl } from '@/i18n'
import { BackendClusterLayer } from './BackendClusterLayer'
import {
  type ExploreMarker,
  MVT_SOURCE_ID,
  MVT_SOURCE_LAYER,
  useExploreChallengesMap,
} from './hooks'
import { LocationIndicator } from './LocationIndicator'
import { LocationPolygonLayer } from './LocationPolygonLayer'

const MVT_LAYER_ID = 'mvt-hidden'
const STACK_ICON_LIMIT = 20

// Explore shows only available tasks, so a pin shows the challenge's task type
// where it has one rather than the (always "Created") status.
const pinIcon = (marker: ExploreMarker, selected: boolean): string =>
  marker.typeKey
    ? `marker-type-${marker.typeKey}-${marker.priority}${selected ? '-selected' : ''}`
    : statusPinIcon(marker, selected ? 'selected' : undefined)

const stackIcon = ({ stackSize }: ExploreMarker, selected: boolean): string =>
  `marker-overlap-${stackSize > STACK_ICON_LIMIT ? 'many' : stackSize}${selected ? '-selected' : ''}`

const markerStyle = (marker: ExploreMarker): MarkerStyle => ({
  icon: marker.stackSize > 1 ? stackIcon(marker, false) : pinIcon(marker, false),
  opacity: 1,
  size: 1,
})

const selectedStyle = (marker: ExploreMarker): MarkerStyle =>
  marker.stackSize > 1
    ? { icon: stackIcon(marker, true), opacity: 1, size: 1 }
    : { icon: pinIcon(marker, true), opacity: 1, size: 1.4 }

export const ExploreChallengesMap = () => {
  const { t } = useIntl()
  const mapId = useId()
  const {
    mapRef,
    mapLoaded,
    setMapLoaded,
    isLoadingMarkers,
    selectedTask,
    setSelectedTask,
    tileUrl,
    markers,
    backendClusters,
    cluster,
    setCluster,
    handleMapMoveEnd,
    locationGeojson,
  } = useExploreChallengesMap()
  const { showDirections, setShowDirections } = useDirectionsToggle(mapLoaded)
  const { portalTarget } = useDrawerPortal()

  // Below z=12 the backend serves cluster markers rather than tasks, so the
  // view is clustered regardless of the toggle.
  const isForcedClustering = backendClusters.length > 0
  const isClustering = isForcedClustering || cluster

  const highlighted = useMemo<HighlightedMarker<ExploreMarker>[]>(
    () => (selectedTask ? [{ marker: selectedTask, style: selectedStyle(selectedTask) }] : []),
    [selectedTask]
  )
  const clearSelection = useCallback(() => setSelectedTask(null), [setSelectedTask])

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
          onMoveEnd={handleMapMoveEnd}
        >
          <LocationPolygonLayer locationGeojson={locationGeojson} />

          {/* Hidden MVT source for efficient tile data fetching */}
          {/* key forces remount when URL changes so MapLibre re-fetches tiles */}
          <Source key={tileUrl} id={MVT_SOURCE_ID} type="vector" tiles={[tileUrl]} maxzoom={12}>
            <Layer
              id={MVT_LAYER_ID}
              type="circle"
              source-layer={MVT_SOURCE_LAYER}
              paint={{ 'circle-radius': 0, 'circle-opacity': 0 }}
            />
          </Source>

          <TaskGeometryLayer
            selectedTaskId={selectedTask?.id ?? null}
            showDirections={showDirections}
          />

          <BackendClusterLayer clusters={backendClusters} />
          <TaskMarkersLayer
            markers={markers}
            cluster={isClustering}
            markerStyle={markerStyle}
            highlighted={highlighted}
            onSelectTask={setSelectedTask}
            onEmptyClick={clearSelection}
          />
        </MapGL>

        <MapLoadingIndicator isLoading={isLoadingMarkers} centered />

        <div className="absolute bottom-2 left-2 z-10 flex items-end gap-2">
          <StatusLegend />
          <ScaleBar mapRef={mapRef} mapLoaded={mapLoaded} />
        </div>
      </div>

      {portalTarget &&
        createPortal(
          <TaskInfoDrawer selectedTask={selectedTask} onClose={clearSelection} mapRef={mapRef} />,
          portalTarget
        )}

      <div className="absolute top-2 left-2 z-10 flex flex-col items-start gap-1">
        <ClusterToggle
          clusteringEnabled={isClustering}
          onToggle={setCluster}
          inline
          disabled={isForcedClustering}
        />
        <LocationIndicator />
      </div>

      <MapControls
        map={mapRef}
        mapLoaded={mapLoaded}
        showZoom={true}
        showLayers={true}
        settings={
          <MapSettingsSection
            title={t({ id: 'map.settings.overlays', defaultMessage: 'Overlays' })}
          >
            <DirectionsSetting checked={showDirections} onCheckedChange={setShowDirections} />
          </MapSettingsSection>
        }
        settingsModified={!showDirections}
      />
    </div>
  )
}
