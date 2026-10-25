import { Maximize2 } from 'lucide-react'
import type { StyleSpecification } from 'maplibre-gl'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useDirectionsToggle } from '@/components/Map/directionsControlButton'
import { MapControls } from '@/components/Map/MapControls'
import { MapGL } from '@/components/Map/MapGL'
import { getCurrentMapStyle } from '@/components/Map/mapStyles'
import { getMapBoundsString } from '@/components/Map/mapUtils'
import { ScaleBar } from '@/components/Map/ScaleBar'
import { StatusLegend } from '@/components/Map/StatusLegend'
import { ClusterToggle } from '@/components/Map/TaskMarkers/ClusterToggle'
import {
  emphasizedPinStyle,
  type HighlightedMarker,
} from '@/components/Map/TaskMarkers/markerStyle'
import { TaskGeometryLayer } from '@/components/Map/TaskMarkers/TaskGeometryLayer'
import { TaskMarkersLayer } from '@/components/Map/TaskMarkers/TaskMarkersLayer'
import { useFitToMarkers } from '@/components/Map/TaskMarkers/useFitToMarkers'
import { MapLoadingIndicator } from '@/components/shared/MapLoadingIndicator'
import { useDrawerPortal } from '@/components/TaskInfoPanel/DrawerPortalContext'
import { TaskInfoDrawer } from '@/components/TaskInfoPanel/TaskInfoDrawer'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { TaskMarker } from '@/types/Task'

const BOUNDS_DEBOUNCE_MS = 400

interface ChallengeTasksMapProps {
  markers: TaskMarker[]
  isLoading: boolean
  mapStyle?: StyleSpecification
  hash?: boolean
  fitDuration?: number
  showLegend?: boolean
  className?: string
  selectedTask?: TaskMarker | null
  onSelectTask?: (task: TaskMarker | null) => void
  onBoundsChange?: (bounds: string) => void
}

export const ChallengeTasksMap = ({
  markers,
  isLoading,
  mapStyle,
  hash = false,
  fitDuration = 0,
  showLegend = true,
  className,
  selectedTask: controlledSelectedTask,
  onSelectTask,
  onBoundsChange,
}: ChallengeTasksMapProps) => {
  const { t } = useIntl()
  const mapId = useId()
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [cluster, setCluster] = useState(true)
  const [initialStyle] = useState(() => mapStyle ?? getCurrentMapStyle())
  const { showDirections, directionsButton } = useDirectionsToggle(mapLoaded)
  const { portalTarget } = useDrawerPortal()

  const [ownSelectedTask, setOwnSelectedTask] = useState<TaskMarker | null>(null)
  const selectedTask = onSelectTask ? (controlledSelectedTask ?? null) : ownSelectedTask
  const setSelectedTask = onSelectTask ?? setOwnSelectedTask
  const clearSelection = useCallback(() => setSelectedTask(null), [setSelectedTask])

  const highlighted = useMemo<HighlightedMarker[]>(
    () =>
      selectedTask
        ? [{ marker: selectedTask, style: emphasizedPinStyle(selectedTask, 'selected') }]
        : [],
    [selectedTask]
  )

  const { zoomToAll } = useFitToMarkers(mapRef, mapLoaded, markers, isLoading, {
    padding: 50,
    duration: fitDuration,
    skipWhenUrlHasView: hash,
  })

  const boundsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reportBounds = useCallback(() => {
    if (!onBoundsChange) return
    if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current)
    boundsTimerRef.current = setTimeout(() => {
      const map = mapRef.current?.getMap()
      if (map) onBoundsChange(getMapBoundsString(map))
    }, BOUNDS_DEBOUNCE_MS)
  }, [onBoundsChange])

  useEffect(
    () => () => {
      if (boundsTimerRef.current) clearTimeout(boundsTimerRef.current)
    },
    []
  )

  return (
    <div className={cn('relative h-full w-full overflow-hidden', className)}>
      <MapGL
        id={mapId}
        ref={mapRef}
        hash={hash}
        initialViewState={{ longitude: 0, latitude: 0, zoom: 1.5 }}
        mapStyle={initialStyle}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setMapLoaded(true)}
        onMoveEnd={onBoundsChange ? reportBounds : undefined}
      >
        <TaskGeometryLayer
          selectedTaskId={selectedTask?.id ?? null}
          showDirections={showDirections}
        />
        <TaskMarkersLayer
          markers={markers}
          cluster={cluster}
          highlighted={highlighted}
          onSelectTask={setSelectedTask}
          onEmptyClick={clearSelection}
        />
      </MapGL>

      {showLegend && (
        <div className="absolute bottom-2 left-2 z-10 flex items-end gap-2">
          <StatusLegend />
          <ScaleBar mapRef={mapRef} mapLoaded={mapLoaded} />
        </div>
      )}

      <MapLoadingIndicator isLoading={isLoading} />

      <MapControls
        map={mapRef}
        mapLoaded={mapLoaded}
        showZoom
        showReset
        showLayers
        collapsible
        defaultOpen
        customButtons={[
          directionsButton,
          ...(zoomToAll
            ? [
                {
                  icon: Maximize2,
                  onClick: zoomToAll,
                  tooltip: t(
                    'manageChallengeDetail.miniMap.zoomToAllTasksTooltip',
                    undefined,
                    'Zoom to all tasks'
                  ),
                  disabled: !mapLoaded,
                },
              ]
            : []),
        ]}
      />

      <div className="absolute top-2 left-2 z-10">
        <ClusterToggle clusteringEnabled={cluster} onToggle={setCluster} inline />
      </div>

      {portalTarget &&
        createPortal(
          <TaskInfoDrawer selectedTask={selectedTask} onClose={clearSelection} mapRef={mapRef} />,
          portalTarget
        )}
    </div>
  )
}
