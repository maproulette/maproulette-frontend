import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Layer, Map as MapGL, Source } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapControls } from '@/components/Map/MapControls'
import { getCurrentMapStyle } from '@/components/Map/mapStyles'
import { ScaleBar } from '@/components/Map/ScaleBar'
import { StatusLegend } from '@/components/Map/StatusLegend'
import { ClusterSource } from '@/components/Map/TaskMarkers/ClusterSource'
import { ClusterToggle } from '@/components/Map/TaskMarkers/ClusterToggle'
import { LAYER_IDS } from '@/components/Map/TaskMarkers/const'
import { SpiderMarkers } from '@/components/Map/TaskMarkers/SpiderMarkers'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import {
  EDITABLE_STATUSES,
  useTaskContext,
} from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { MapLoadingIndicator } from '@/components/shared/MapLoadingIndicator'
import { useIntl } from '@/i18n'
import type { TaskMarker } from '@/types/Task'
import { useEditorContext } from './contexts/EditorContext'
import { ClearBundleDialog } from './TaskMap/ClearBundleDialog'
import { LassoLayer } from './TaskMap/LassoLayer'
import { MultiTaskPanel } from './TaskMap/MultiTaskPanel'
import { useTaskEditMapContext } from './TaskMap/TaskEditMapContext'
import { TaskGeometryLayer } from './TaskMap/TaskGeometryLayer'
import { useAllMarkersMap } from './TaskMap/useAllMarkersMap'
import { useLassoBundleSync } from './TaskMap/useLassoBundleSync'
import { useMapControlButtons } from './TaskMap/useMapControlButtons'
import { useMapNavigation } from './TaskMap/useMapNavigation'
import { useMarkerVisibility } from './TaskMap/useMarkerVisibility'
import { useStyledClusteredData } from './TaskMap/useStyledClusteredData'
import { useTaskMapShortcuts } from './TaskMap/useTaskMapShortcuts'

const OsmIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <circle cx="10" cy="10" r="6" />
    <path d="m21 21-5.35-5.35" />
    <path d="M7 10h6M10 7v6" strokeWidth="1.5" opacity="0.6" />
  </svg>
)

export const TaskMap = () => {
  const { t } = useIntl()
  const mapId = useId()
  const exploreSourceId = useId()
  const exploreCirclesLayerId = useId()
  const { bundleEditsDisabled, activeBundle } = useTaskBundleContext()
  const { task, isLocked } = useTaskContext()
  const { openIdEditor, idEditorMounted, idUnsavedCount, activeView, idViewportRef } =
    useEditorContext()
  const prevActiveView = useRef(activeView)
  const isEditableStatus = EDITABLE_STATUSES.includes(task.status ?? 0)
  const {
    selectedMarker,
    markersHidden,
    activeTaskId,
    drawingMode,
    selectedTaskIds,
    hoveredBundleTaskId,
  } = useTaskMapContext()

  const {
    mapRef,
    mapLoaded,
    setMapLoaded,
    markersData,
    overlapData,
    isLoadingMarkers,
    onMapClick,
    onMouseMove,
    isClustered,
    setIsClustered,
    primaryTaskId,
    spideredMarkers,
    clusteredGeoJSONData,
    initialBoundsApplied,
    showExploreLayer,
  } = useTaskEditMapContext()

  const exploreTileUrl = useMemo(
    () =>
      `${window.env.VITE_API_BASE_URL || 'http://127.0.0.1:9000'}/api/v2/taskTilesMvt/{z}/{x}/{y}?global=true`,
    []
  )

  useEffect(() => {
    const wasId = prevActiveView.current === 'id'
    prevActiveView.current = activeView
    if (wasId && activeView === 'map' && idViewportRef.current && mapRef.current) {
      const { lat, lng, zoom } = idViewportRef.current
      mapRef.current.jumpTo({ center: [lng, lat], zoom })
    }
  }, [activeView, idViewportRef, mapRef])

  useMarkerVisibility()
  useLassoBundleSync()
  useTaskMapShortcuts()

  // Exposes the underlying maplibre map so e2e tests (run via `vite --mode
  // test`, see playwright.config.ts) can project marker lng/lat to precise
  // screen coordinates for lasso-drag interactions. Never present outside
  // that mode, so this has no effect in dev or production builds.
  useEffect(() => {
    if (import.meta.env.MODE !== 'test' || !mapLoaded || !mapRef.current) return
    ;(window as unknown as { __e2eMap?: maplibregl.Map }).__e2eMap = mapRef.current.getMap()
  }, [mapLoaded, mapRef])

  const allMarkersMap = useAllMarkersMap(markersData.markers, overlapData.overlaps)
  const styledClusteredData = useStyledClusteredData(clusteredGeoJSONData)

  const { handleCenterToTask } = useMapNavigation(mapLoaded, markersData.markers, allMarkersMap)

  const mapControlButtons = useMapControlButtons(mapLoaded, handleCenterToTask)

  const [initialViewState] = useState(() => {
    const [lng, lat] = task.location.coordinates
    return { longitude: lng, latitude: lat, zoom: 15 }
  })

  return (
    <div className="relative h-full w-full">
      <div
        className="absolute inset-0 transition-opacity duration-150"
        style={{ opacity: initialBoundsApplied ? 1 : 0 }}
      >
        <MapGL
          id={mapId}
          ref={mapRef}
          hash
          initialViewState={initialViewState}
          mapStyle={getCurrentMapStyle()}
          onLoad={() => setMapLoaded(true)}
          onClick={onMapClick}
          onMouseMove={onMouseMove}
          interactiveLayerIds={
            spideredMarkers.size > 0
              ? [
                  LAYER_IDS.clusters,
                  LAYER_IDS.clusterCount,
                  ...LAYER_IDS.allPoints,
                  'spidered-markers-layer',
                ]
              : [LAYER_IDS.clusters, LAYER_IDS.clusterCount, ...LAYER_IDS.allPoints]
          }
          cursor={drawingMode ? 'crosshair' : undefined}
        >
          {showExploreLayer && (
            <Source
              key={exploreTileUrl}
              id={exploreSourceId}
              type="vector"
              tiles={[exploreTileUrl]}
              maxzoom={18}
            >
              <Layer
                id={exploreCirclesLayerId}
                type="circle"
                source-layer="default"
                filter={['==', ['get', 'group_type'], 0]}
                paint={{
                  'circle-radius': 3,
                  'circle-color': '#94a3b8',
                  'circle-opacity': 0.6,
                  'circle-stroke-width': 1,
                  'circle-stroke-color': '#0f172a',
                  'circle-stroke-opacity': 0.4,
                }}
              />
            </Source>
          )}

          {!markersHidden && <ClusterSource clusteredData={styledClusteredData} />}

          {!markersHidden && spideredMarkers.size > 0 && (
            <SpiderMarkers
              markers={Array.from(spideredMarkers.keys())
                .map((id) => allMarkersMap.get(id))
                .filter((m): m is TaskMarker => m !== undefined)}
              spiderPositions={spideredMarkers}
              primaryTaskId={primaryTaskId}
              activeBundle={activeBundle}
              selectedTaskId={selectedMarker?.id ?? null}
              activeTaskId={activeTaskId}
              lassoSelectedTaskIds={selectedTaskIds}
              hoveredTaskId={hoveredBundleTaskId}
            />
          )}

          <TaskGeometryLayer />
          <LassoLayer />
        </MapGL>
      </div>

      <div className="absolute bottom-2 left-2 z-10 flex items-end gap-2">
        <StatusLegend />
        <ScaleBar mapRef={mapRef} mapLoaded={mapLoaded} />
      </div>

      <MapLoadingIndicator isLoading={isLoadingMarkers || !initialBoundsApplied} centered />

      {/* Top-left inline controls: cluster toggle + multi-task panel + iD Editor */}
      <div className="absolute top-2 left-2 z-10 flex items-start gap-2">
        <ClusterToggle clusteringEnabled={isClustered} onToggle={setIsClustered} inline />
        {isLocked && !bundleEditsDisabled && isEditableStatus && <MultiTaskPanel />}
        {isLocked && (
          <button
            type="button"
            onClick={openIdEditor}
            className="relative flex h-10 items-center gap-1.5 rounded-lg bg-zinc-800/90 px-3 font-medium text-sm text-white shadow-md transition-colors hover:bg-zinc-700"
            title={t('taskEditPage.taskMap.editInId', undefined, 'Edit in iD (inline)')}
          >
            <OsmIcon className="h-4 w-4" />
            {t('taskEditPage.taskMap.editInIdShort', undefined, 'Edit in iD')}
            {idEditorMounted && (
              <span className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-green-400" />
                {idUnsavedCount > 0 && (
                  <span className="rounded-full bg-yellow-500 px-1.5 py-0.5 font-bold text-[10px] text-white leading-none">
                    {idUnsavedCount}
                  </span>
                )}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Drawing mode indicator */}
      {drawingMode && (
        <div className="-translate-x-1/2 absolute top-14 left-1/2 rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white shadow-md">
          {t(
            'taskEditPage.taskMap.drawingModeHint',
            undefined,
            'Click and drag to select tasks • ESC to cancel'
          )}
        </div>
      )}

      <MapControls
        map={mapRef}
        mapLoaded={mapLoaded}
        showZoom={true}
        showReset={true}
        showLayers={true}
        collapsible={true}
        defaultOpen={true}
        customButtons={mapControlButtons}
      />

      <ClearBundleDialog />
    </div>
  )
}
