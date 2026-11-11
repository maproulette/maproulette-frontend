import maplibregl from 'maplibre-gl'
import { useCallback, useId, useMemo } from 'react'
import type { MapMouseEvent } from 'react-map-gl/maplibre'
import { Layer, Marker, Source } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin } from 'lucide-react'
import { api } from '@/api'
import { MapGL } from '@/components/Map/MapGL'
import { getCurrentMapStyle } from '@/components/Map/mapStyles'
import { useIntl } from '@/i18n'
import { useTaskContext } from './contexts/TaskContext'

interface TaskNearbyMapProps {
  selectedTaskId: number | null
  onTaskSelect: (taskId: number | null) => void
}

export const TaskNearbyMap = ({ selectedTaskId, onTaskSelect }: TaskNearbyMapProps) => {
  const { t } = useIntl()
  const mapId = useId()
  const sourceId = useId()
  const layerId = useId()
  const { task } = useTaskContext()

  const [currentLng, currentLat] = task.location.coordinates

  const { data = [], isLoading } = api.challenge.getTasksNearby(task.parent, task.id)

  const nearbyTasks = useMemo(() => {
    const sourceTasks = data.filter(
      (nearby) => task.bundleId == null || nearby.bundleId !== task.bundleId
    )

    return sourceTasks.map((nearby) => {
      const [lng, lat] = nearby.location.coordinates
      return { id: nearby.id, lng, lat }
    })
  }, [data, task.bundleId])

  const nearbyTasksGeoJSON = useMemo((): GeoJSON.FeatureCollection => {
    return {
      type: 'FeatureCollection',
      features: nearbyTasks.map((task) => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [task.lng, task.lat],
        },
        properties: {
          id: task.id,
        },
      })),
    }
  }, [nearbyTasks])

  const initialViewState = useMemo(() => {
    if (nearbyTasks.length === 0) {
      return { longitude: currentLng, latitude: currentLat, zoom: 16 }
    }
    const bounds = new maplibregl.LngLatBounds([currentLng, currentLat], [currentLng, currentLat])
    for (const task of nearbyTasks) bounds.extend([task.lng, task.lat])
    return { bounds, fitBoundsOptions: { padding: 48, maxZoom: 16 } }
  }, [nearbyTasks, currentLng, currentLat])

  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      const id = e.features?.[0]?.properties?.id as number | undefined
      if (id != null) onTaskSelect(id === selectedTaskId ? null : id)
    },
    [onTaskSelect, selectedTaskId]
  )

  if (isLoading) {
    return <div className="h-64 w-full rounded-lg bg-zinc-100 dark:bg-slate-800" />
  }

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg">
      <MapGL
        id={mapId}
        key={task.id}
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
                ['==', ['get', 'id'], selectedTaskId ?? -1],
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
      {selectedTaskId && (
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
