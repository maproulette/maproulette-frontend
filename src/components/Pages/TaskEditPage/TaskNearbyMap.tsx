import maplibregl from 'maplibre-gl'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import type { MapMouseEvent, MapRef } from 'react-map-gl/maplibre'
import { Layer, Map as MapGL, Marker, Source } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin } from 'lucide-react'
import { api } from '@/api'
import { getCurrentMapStyle } from '@/components/Map/mapStyles'
import { useIntl } from '@/i18n'
import type { Task } from '@/types/Task'

interface TaskSelectionMapProps {
  currentTask: Task
  tasks: Task[]
  selectedTaskId: number | null
  onTaskSelect: (taskId: number | null) => void
  excludeCurrentBundle?: boolean
  /** Show the "Task #N selected" overlay. Default true. */
  showSelectedBadge?: boolean
}

export const TaskSelectionMap = ({
  currentTask,
  tasks: nearbyTasks,
  selectedTaskId,
  onTaskSelect,
  excludeCurrentBundle = false,
  showSelectedBadge = true,
}: TaskSelectionMapProps) => {
  const { t } = useIntl()
  const mapRef = useRef<MapRef | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapId = useId()
  const sourceId = useId()
  const layerId = useId()

  // Track if we've already zoomed to fit initial tasks
  const hasZoomedRef = useRef(false)
  const centeredTaskIdRef = useRef<number | null>(null)

  const [currentLng, currentLat] = currentTask.location.coordinates

  // Reason: GeoJSON processing — parses nearby task locations and drops bundle members
  const nearbyTaskLocations = useMemo(() => {
    return nearbyTasks
      .filter(
        (task) =>
          !excludeCurrentBundle ||
          currentTask.bundleId == null ||
          task.bundleId !== currentTask.bundleId
      )
      .map((task) => {
        const [lng, lat] = task.location.coordinates
        return { id: task.id, lng, lat }
      })
  }, [nearbyTasks, currentTask.bundleId, excludeCurrentBundle])

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

  const centerOnTasks = useCallback(() => {
    if (!mapRef.current || !mapLoaded) return

    const points: [number, number][] = [[currentLng, currentLat]]
    for (const loc of nearbyTaskLocations) {
      points.push([loc.lng, loc.lat])
    }

    if (points.length === 1) {
      mapRef.current.jumpTo({
        center: points[0],
        zoom: 16,
      })
    } else {
      const bounds = new maplibregl.LngLatBounds(points[0], points[0])
      for (const point of points) {
        bounds.extend(point)
      }
      mapRef.current.fitBounds(bounds, {
        padding: 40,
        maxZoom: 16,
        duration: 0,
      })
    }
  }, [mapLoaded, nearbyTaskLocations, currentLng, currentLat])

  // Zoom to fit all tasks (current + nearby) on first load
  useEffect(() => {
    if (!mapLoaded) return
    if (hasZoomedRef.current) return
    centerOnTasks()
    hasZoomedRef.current = true
    centeredTaskIdRef.current = currentTask.id
  }, [mapLoaded, centerOnTasks, currentTask.id])

  // Re-center when the current task changes (e.g. preview Prev/Next)
  useEffect(() => {
    if (!mapLoaded) return
    if (centeredTaskIdRef.current === currentTask.id) return
    centerOnTasks()
    centeredTaskIdRef.current = currentTask.id
  }, [mapLoaded, currentTask.id, currentLng, currentLat, centerOnTasks])

  const initialViewState = {
    longitude: currentLng,
    latitude: currentLat,
    zoom: 14,
  }

  // Reason: stable callback prevents map event listener re-registration
  const handleMapClick = useCallback(
    (e: MapMouseEvent) => {
      if (!mapRef.current || !mapLoaded) return

      const features = mapRef.current.queryRenderedFeatures(e.point, {
        layers: [layerId],
      })

      if (features.length > 0) {
        const taskId = features[0].properties?.id as number
        onTaskSelect(taskId === selectedTaskId ? null : taskId)
      }
    },
    [layerId, mapLoaded, onTaskSelect, selectedTaskId]
  )

  return (
    <div className="relative h-64 w-full overflow-hidden rounded-lg">
      <MapGL
        id={mapId}
        ref={mapRef}
        initialViewState={initialViewState}
        mapStyle={getCurrentMapStyle()}
        onLoad={() => setMapLoaded(true)}
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
              {t('common.current', undefined, 'Current')}
            </span>
          </div>
        </Marker>
      </MapGL>

      {/* Task count indicator */}
      <div className="absolute right-2 bottom-2 rounded bg-white/90 px-2 py-1 text-xs shadow dark:bg-slate-800/90">
        {t(
          'taskEditPage.taskNearbyMap.nearbyCount',
          { count: nearbyTasks.length },
          '{count, plural, one {# nearby task} other {# nearby tasks}}'
        )}
      </div>

      {/* Selected task info */}
      {showSelectedBadge && selectedTaskId && (
        <div className="absolute top-2 left-2 rounded bg-green-500 px-2 py-1 font-medium text-white text-xs shadow">
          {t(
            'taskEditPage.taskNearbyMap.selectedTask',
            { id: selectedTaskId },
            'Task #{id} selected'
          )}
        </div>
      )}
    </div>
  )
}

type TaskNearbyMapProps = Omit<TaskSelectionMapProps, 'tasks'>

export const TaskNearbyMap = (props: TaskNearbyMapProps) => {
  const { data: nearbyTasks = [] } = api.challenge.getTasksNearby(
    props.currentTask.parent,
    props.currentTask.id
  )

  return <TaskSelectionMap {...props} tasks={nearbyTasks} excludeCurrentBundle />
}
