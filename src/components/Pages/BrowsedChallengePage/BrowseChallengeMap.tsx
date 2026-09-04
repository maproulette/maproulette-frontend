import { Maximize2 } from 'lucide-react'
import { useId, useState } from 'react'
import { createPortal } from 'react-dom'
import { Map as MapGL } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { resolveMapStyle } from '@/components/Map/basemap'
import { MapControls } from '@/components/Map/MapControls'
import { ScaleBar } from '@/components/Map/ScaleBar'
import { StatusLegend } from '@/components/Map/StatusLegend'
import { ClusterSource } from '@/components/Map/TaskMarkers/ClusterSource'
import { ClusterToggle } from '@/components/Map/TaskMarkers/ClusterToggle'
import { clusterLayer } from '@/components/Map/TaskMarkers/clusterLayers'
import { LAYER_IDS } from '@/components/Map/TaskMarkers/const'
import { SpiderMarkers } from '@/components/Map/TaskMarkers/SpiderMarkers'
import { TaskGeometryLayer } from '@/components/Map/TaskMarkers/TaskGeometryLayer'
import { useWebGLContextRecovery } from '@/components/Map/useWebGLContextRecovery'
import { MapLoadingIndicator } from '@/components/shared/MapLoadingIndicator'
import { useDrawerPortal } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { TaskInfoDrawer } from '@/components/TaskInfoPanel/TaskInfoDrawer'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { useBrowseChallengeMap } from './BrowseChallengeMap/hooks'
import { useBrowsedChallengeContext } from './contexts/BrowsedChallengeContext'

export const BrowseChallengeMap = () => {
  const mapId = useId()
  const { t } = useIntl()
  const { challenge } = useBrowsedChallengeContext()
  const { user } = useAuthContext()
  // Same precedence as the task map: challenge basemap, then the mapper's
  // own default, then the style they last picked.
  const [mapStyle] = useState(() => resolveMapStyle(challenge, user?.settings))
  const {
    mapRef,
    mapLoaded,
    setMapLoaded,
    selectedTask,
    setSelectedTask,
    shouldCluster,
    markersData,
    isLoadingMarkers,
    handleMapClick,
    handleMapMouseMove,
    setCluster,
    clusteredGeoJSONData,
    selectedTaskGeoJSON,
    zoomToAllTags,
    hasAllTagsBounds,
    spideredMarkers,
    setSpideredMarkers,
    initialViewState,
  } = useBrowseChallengeMap()

  const { mapKey, attachMap } = useWebGLContextRecovery(mapRef, setMapLoaded)

  const { portalTarget } = useDrawerPortal()

  return (
    <div className="relative h-full w-full">
      <MapGL
        key={mapKey}
        id={mapId}
        ref={attachMap}
        hash
        initialViewState={initialViewState}
        mapStyle={mapStyle}
        onLoad={() => setMapLoaded(true)}
        onClick={handleMapClick}
        onMouseMove={handleMapMouseMove}
        interactiveLayerIds={
          shouldCluster && clusterLayer.id
            ? [
                clusterLayer.id,
                LAYER_IDS.clusterCount,
                ...LAYER_IDS.allPoints,
                'spidered-markers-layer',
              ]
            : [...LAYER_IDS.allPoints, 'spidered-markers-layer']
        }
      >
        {/* Selected task drawn on top via the shared selected overlay. Keeping
            it in its own 1-feature source keeps clicks O(1) at 10k+ tasks. */}
        <ClusterSource
          clusteredData={clusteredGeoJSONData}
          selectedTaskData={selectedTaskGeoJSON}
        />

        <TaskGeometryLayer selectedTaskId={selectedTask?.id ?? null} />

        {spideredMarkers.size > 0 && (
          <SpiderMarkers
            markers={markersData.markers.filter((m) => spideredMarkers.has(m.id))}
            spiderPositions={spideredMarkers}
            selectedTaskId={selectedTask?.id}
          />
        )}
      </MapGL>

      <div className="absolute bottom-2 left-2 z-10 flex items-end gap-2">
        <StatusLegend />
        <ScaleBar mapRef={mapRef} mapLoaded={mapLoaded} />
      </div>

      {portalTarget &&
        createPortal(
          <TaskInfoDrawer
            selectedTask={selectedTask}
            onClose={() => {
              setSelectedTask(null)
              setSpideredMarkers(new Map())
            }}
            mapRef={mapRef}
          />,
          portalTarget
        )}

      <MapLoadingIndicator isLoading={isLoadingMarkers} />

      <MapControls
        map={mapRef}
        mapLoaded={mapLoaded}
        showZoom={true}
        showReset={true}
        showLayers={true}
        collapsible={true}
        defaultOpen={true}
        customButtons={
          hasAllTagsBounds
            ? [
                {
                  icon: Maximize2,
                  onClick: zoomToAllTags,
                  tooltip: t(
                    'browsedChallengePage.map.zoomOutToAllTags',
                    undefined,
                    'Zoom out to all tags'
                  ),
                  disabled: !mapLoaded,
                },
              ]
            : []
        }
      />

      <div className="absolute top-2 left-2 z-10">
        <ClusterToggle clusteringEnabled={shouldCluster} onToggle={setCluster} inline />
      </div>
    </div>
  )
}
