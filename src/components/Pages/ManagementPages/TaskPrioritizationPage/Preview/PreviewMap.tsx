import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { Layer, type MapRef, Source, useMap } from 'react-map-gl/maplibre'
import { MapControls } from '@/components/Map/MapControls'
import { MapGL } from '@/components/Map/MapGL'
import { getCurrentMapStyle } from '@/components/Map/mapStyles'
import { ScaleBar } from '@/components/Map/ScaleBar'
import type { HighlightedMarker, MarkerStyle } from '@/components/Map/TaskMarkers/markerStyle'
import { TaskMarkersLayer } from '@/components/Map/TaskMarkers/TaskMarkersLayer'
import { useFitToMarkers } from '@/components/Map/TaskMarkers/useFitToMarkers'
import { Spinner } from '@/components/ui/Spinner'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { PRIORITY_COLOR, type TaskPriorityValue } from '@/types/Priority'
import type { TaskMarker } from '@/types/Task'
import { usePrioritizationContext } from '../PrioritizationContext'
import { useTaskPreview } from '../TaskPreviewContext'
import { createPriorityMarkerIcons, priorityPinName } from './createPriorityMarkerIcons'
import 'maplibre-gl/dist/maplibre-gl.css'

interface PreviewMapRenderCtx {
  map: React.RefObject<MapRef | null>
  mapLoaded: boolean
  cluster: boolean
  setCluster: (next: boolean) => void
}

interface Props {
  externalMapRef?: React.RefObject<MapRef | null>
  onMapLoaded?: (loaded: boolean) => void
  onTaskSelect?: (task: TaskMarker | null) => void
  selectedTaskId?: number | null
  children?: (ctx: PreviewMapRenderCtx) => React.ReactNode
}

const BOUNDS_OUTLINE_COLORS: Record<TaskPriorityValue, string> = {
  0: PRIORITY_COLOR[0].hex,
  1: PRIORITY_COLOR[1].hex,
  2: PRIORITY_COLOR[2].hex,
}

const priorityPinStyle = (marker: TaskMarker): MarkerStyle => ({
  icon: priorityPinName(marker.priority as TaskPriorityValue),
  opacity: 1,
  size: 0.9,
})

export const PreviewMap = ({
  externalMapRef,
  onMapLoaded,
  onTaskSelect,
  selectedTaskId,
  children,
}: Props) => {
  const { t } = useIntl()
  const mapId = useId()
  const idPrefix = useId().replace(/:/g, '-')
  const localMapRef = useRef<MapRef | null>(null)
  const mapRef = externalMapRef ?? localMapRef
  const [mapLoaded, setMapLoaded] = useState(false)
  const { markers, preview } = useTaskPreview()
  const { draft } = usePrioritizationContext()
  const [cluster, setCluster] = useState(true)

  useEffect(() => {
    onMapLoaded?.(mapLoaded)
  }, [mapLoaded, onMapLoaded])

  const previewMarkers = useMemo(
    () => markers.map((marker) => ({ ...marker, priority: preview.byTaskId.get(marker.id) ?? 1 })),
    [markers, preview.byTaskId]
  )

  const markersById = useMemo(() => new Map(markers.map((m) => [m.id, m])), [markers])

  const highlighted = useMemo<HighlightedMarker[]>(() => {
    const selected = previewMarkers.find((m) => m.id === selectedTaskId)
    return selected
      ? [{ marker: selected, style: { ...priorityPinStyle(selected), size: 1.4 } }]
      : []
  }, [previewMarkers, selectedTaskId])

  const selectTask = useCallback(
    (marker: TaskMarker) => onTaskSelect?.(markersById.get(marker.id) ?? marker),
    [markersById, onTaskSelect]
  )

  useFitToMarkers(mapRef, mapLoaded, markers, false, { padding: 40, duration: 0 })

  const tierBoundsLayers = useMemo(
    () => [
      { priority: 0 as TaskPriorityValue, fc: draft.high.bounds },
      { priority: 1 as TaskPriorityValue, fc: draft.medium.bounds },
      { priority: 2 as TaskPriorityValue, fc: draft.low.bounds },
    ],
    [draft.high.bounds, draft.medium.bounds, draft.low.bounds]
  )

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden rounded-lg border border-zinc-200 dark:border-slate-700'
      )}
    >
      <MapGL
        id={mapId}
        ref={mapRef}
        initialViewState={{ longitude: 0, latitude: 0, zoom: 1.5 }}
        mapStyle={getCurrentMapStyle()}
        style={{ width: '100%', height: '100%' }}
        onLoad={() => setMapLoaded(true)}
        dragRotate={false}
        touchPitch={false}
      >
        <PriorityIconLoader />
        <TaskMarkersLayer
          markers={previewMarkers}
          cluster={cluster}
          markerStyle={priorityPinStyle}
          highlighted={highlighted}
          onSelectTask={selectTask}
        />
        {tierBoundsLayers.map(({ priority, fc }) =>
          fc && fc.features.length > 0 ? (
            <Source
              key={`bounds-${priority}`}
              id={`${idPrefix}-bounds-${priority}`}
              type="geojson"
              data={fc}
            >
              <Layer
                id={`${idPrefix}-bounds-${priority}-fill`}
                type="fill"
                paint={{
                  'fill-color': BOUNDS_OUTLINE_COLORS[priority],
                  'fill-opacity': 0.08,
                }}
              />
              <Layer
                id={`${idPrefix}-bounds-${priority}-line`}
                type="line"
                paint={{
                  'line-color': BOUNDS_OUTLINE_COLORS[priority],
                  'line-width': 2,
                  'line-dasharray': [2, 2],
                }}
              />
            </Source>
          ) : null
        )}
      </MapGL>

      <MapControls
        map={mapRef}
        mapLoaded={mapLoaded}
        showZoom
        showReset
        showLayers={false}
        collapsible
        defaultOpen
      />

      <div className="pointer-events-none absolute bottom-2 left-2 z-10">
        <ScaleBar mapRef={mapRef} mapLoaded={mapLoaded} />
      </div>

      {preview.isEvaluating && (
        <div
          className="pointer-events-none absolute top-3 right-3 z-10 inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white/95 px-2.5 py-1.5 font-medium text-xs text-zinc-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/95 dark:text-slate-200"
          aria-live="polite"
        >
          <Spinner size="sm" />
          {t('taskPrioritizationPage.previewMap.updatingPreview', undefined, 'Updating preview…')}
        </div>
      )}

      {children?.({ map: mapRef, mapLoaded, cluster, setCluster })}
    </div>
  )
}

const PriorityIconLoader = () => {
  const { current } = useMap()
  useEffect(() => {
    const map = current?.getMap()
    if (!map) return
    const onStyle = () => createPriorityMarkerIcons(map, () => map.triggerRepaint())
    if (map.isStyleLoaded()) onStyle()
    else map.once('load', onStyle)
    return () => {
      map.off('load', onStyle)
    }
  }, [current])
  return null
}
