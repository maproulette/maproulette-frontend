import maplibregl from 'maplibre-gl'
import { useCallback, useId, useMemo, useRef } from 'react'
import type { MapMouseEvent, MapRef } from 'react-map-gl/maplibre'
import { Layer, Marker, Source } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin } from 'lucide-react'
import { api } from '@/api'
import { MapGL } from '@/components/Map/MapGL'
import { getCurrentMapStyle } from '@/components/Map/mapStyles'
import { useIntl } from '@/i18n'
import type { Task } from '@/types/Task'

interface TaskNearbyMapProps {
  currentTask: Task
  selectedTaskId: number | null
  onTaskSelect: (taskId: number | null) => void
  /** Optional override for the tasks to show in the map */
  tasks?: Task[]
  /** Show the "Task #N selected" overlay. Default true. */
  showSelectedBadge?: boolean
}

export const TaskNearbyMap = ({
  currentTask,
  selectedTaskId,
  onTaskSelect,
  tasks,
  showSelectedBadge = true,
}: TaskNearbyMapProps) => {
  const { t } = useIntl()
  const mapRef = useRef<MapRef | null>(null)
  const mapId = useId()
  const sourceId = useId()
  const layerId = useId()

  const [currentLng, currentLat] = currentTask.location.coordinates

  const { data, isLoading } = api.challenge.getTasksNearby(
    currentTask.parent,
    currentTask.id,
    undefined,
    tasks === undefined
  )

  const nearbyTasks = useMemo(
    () =>
      tasks ??
      (data ?? []).filter(
        (task) => currentTask.bundleId == null || task.bundleId !== currentTask.bundleId
      ),
    [tasks, data, currentTask.bundleId]
  )

  const nearbyTaskLocations = useMemo(() => {
    return nearbyTasks.map((task) => {
      const [lng, lat] = task.location.coordinates
      return { id: task.id, lng, lat }
    })
  }, [nearbyTasks])

  // Reason: GeoJSON processing — builds FeatureCollection from parsed locations
  const nearbyTasksGeoJSON = useMemo((): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: nearbyTaskLocations.map((loc) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [loc.lng, loc.lat],
        },
        properties: {
          id: loc.id,
          isSelected: loc.id === selectedTaskId,
        },
      })),
    }
  }, [nearbyTaskLocations, selectedTaskId])

  const initialViewState = useMemo(() => {
    if (nearbyTaskLocations.length === 0) {
      return { longitude: currentLng, latitude: currentLat, zoom: 16 }
    }
    const bounds = new maplibregl.LngLatBounds([currentLng, currentLat], [currentLng, currentLat])
    for (const loc of nearbyTaskLocations) bounds.extend([loc.lng, loc.lat])
    return { bounds, fitBoundsOptions: { padding: 48, maxZoom: 16 } }
  }, [nearbyTaskLocations, currentLng, currentLat])

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (!mapRef.current) return

      const features = mapRef.current.queryRenderedFeatures(e.point, {
        layers: [layerId],
      })

      if (features.length > 0) {
        const taskId = features[0].properties?.id as number
        onTaskSelect(taskId === selectedTaskId ? null : taskId)
      }
    },
    [layerId, onTaskSelect, selectedTaskId]
  )

  if (isLoading) {
    return <div className="h-64 w-full rounded-lg bg-zinc-100 dark:bg-slate-800" />
  }

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg">
      <MapGL
        id={mapId}
        key={currentTask.id}
        ref={mapRef}
        initialViewState={initialViewState}
        mapStyle={getCurrentMapStyle()}
        onClick={handleMapClick}
        interactiveLayerIds={[layerId]}
        cursor="pointer"
      >
        {/* Nearby tasks layer */}
        <Source id={sourceId} type="geojson" data={nearbyTasksGeoJSON}>
          <Layer
            id={layerId}
            type="circle"
            paint={{
              'circle-radius': 8,
              'circle-color': [
                'case',
                ['get', 'isSelected'],
                '#f59e0b', // Amber for selected
                '#3b82f6', // Blue for unselected
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
            }}
          />
        </Source>

        {/* Current task marker */}
        <Marker longitude={currentLng} latitude={currentLat} anchor="bottom">
          <div className="flex flex-col items-center">
            <MapPin className="h-8 w-8 fill-amber-500 text-amber-600 drop-shadow-md" />
            <span className="mt-0.5 rounded bg-amber-500 px-1.5 py-0.5 font-medium text-white text-xs shadow">
              {t({ id: 'common.current', defaultMessage: 'Current' })}
            </span>
          </div>
        </Marker>
      </MapGL>

      {/* Task count indicator */}
      <div className="absolute top-2 right-2 rounded bg-white/90 px-2 py-1 text-xs shadow dark:bg-slate-800/90">
        {t(
          {
            id: 'taskEditPage.taskNearbyMap.nearbyCount',
            defaultMessage: '{count, plural, one {# nearby task} other {# nearby tasks}}',
          },
          { count: nearbyTasks.length }
        )}
      </div>

      {/* Selected task info */}
      {showSelectedBadge && selectedTaskId && (
        <div className="absolute top-2 left-2 rounded bg-green-500 px-2 py-1 font-medium text-white text-xs shadow">
          {t(
            {
              id: 'taskEditPage.taskNearbyMap.selectedTask',
              defaultMessage: 'Task #{id} selected',
            },
            { id: selectedTaskId }
          )}
        </div>
      )}
    </div>
  )
}
