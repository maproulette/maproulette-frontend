import { Map as MapGL, Marker, NavigationControl } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { getCurrentMapStyle } from '@/components/Map/mapStyles'
import { TASK_MARKER_SIZE, taskMarkerDataUri } from '@/components/Map/TaskMarkers/createMarkerIcons'
import { cn } from '@/lib/utils'

interface Props {
  latitude: number
  longitude: number
  status: number
  priority: number
  /** Accessible name, since the pin itself carries no text. */
  label: string
  className?: string
}

/** Whole world in view; the mapper zooms in from there to find where they've landed. */
const INITIAL_ZOOM = 0

/**
 * Small map centred on a single task, opening at world view so zooming in is the
 * reveal. Uses the same pin artwork as the challenge and explore maps.
 */
export const TaskLocationMap = ({
  latitude,
  longitude,
  status,
  priority,
  label,
  className,
}: Props) => (
  <div
    className={cn(
      'overflow-hidden rounded-md border border-zinc-200 dark:border-slate-700',
      className
    )}
  >
    <MapGL
      initialViewState={{ latitude, longitude, zoom: INITIAL_ZOOM }}
      mapStyle={getCurrentMapStyle()}
      style={{ width: '100%', height: '100%' }}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <Marker latitude={latitude} longitude={longitude} anchor="bottom">
        <img
          src={taskMarkerDataUri(status, priority)}
          width={TASK_MARKER_SIZE.width}
          height={TASK_MARKER_SIZE.height}
          alt={label}
        />
      </Marker>
    </MapGL>
  </div>
)
