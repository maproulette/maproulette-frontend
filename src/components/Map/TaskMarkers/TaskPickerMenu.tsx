import { ChevronRight, MapPin } from 'lucide-react'
import type { Offset } from 'maplibre-gl'
import { useEffect, useMemo } from 'react'
import { Popup } from 'react-map-gl/maplibre'
import { STATUS_CONFIG } from '@/components/Map/TaskMarkers/const'
import { TASK_MARKER_SIZE } from '@/components/Map/TaskMarkers/createMarkerIcons'
import { useIntl } from '@/i18n'
import { getStatusLabel } from '@/lib/taskConstants'
import type { TaskMarker } from '@/types/Task'

export interface MarkerExtent {
  above: number
  below: number
  halfWidth: number
}

export interface TaskPickerState {
  lngLat: [number, number]
  extent: MarkerExtent
  markers: TaskMarker[]
  total: number
}

const GAP_PX = 14
const CORNER_POINTER_PX = 18

export const pinExtent = (scale = 1): MarkerExtent => ({
  above: TASK_MARKER_SIZE.height * scale,
  below: 0,
  halfWidth: (TASK_MARKER_SIZE.width / 2) * scale,
})

export const circleExtent = (radius: number): MarkerExtent => ({
  above: radius,
  below: radius,
  halfWidth: radius,
})

const popupOffset = ({ above, below, halfWidth }: MarkerExtent): Offset => {
  const up: [number, number] = [0, -(above + GAP_PX)]
  const down: [number, number] = [0, below + GAP_PX]
  const middle = (below - above) / 2
  return {
    center: [0, 0],
    top: down,
    'top-left': [-CORNER_POINTER_PX, down[1]],
    'top-right': [CORNER_POINTER_PX, down[1]],
    bottom: up,
    'bottom-left': [-CORNER_POINTER_PX, up[1]],
    'bottom-right': [CORNER_POINTER_PX, up[1]],
    left: [halfWidth + GAP_PX, middle],
    right: [-(halfWidth + GAP_PX), middle],
  }
}

interface TaskPickerMenuProps {
  picker: TaskPickerState
  onSelect: (marker: TaskMarker) => void
  onClose: () => void
}

export const TaskPickerMenu = ({ picker, onSelect, onClose }: TaskPickerMenuProps) => {
  const { t } = useIntl()
  const offset = useMemo(() => popupOffset(picker.extent), [picker.extent])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <Popup
      longitude={picker.lngLat[0]}
      latitude={picker.lngLat[1]}
      offset={offset}
      closeButton={false}
      closeOnClick={false}
      maxWidth="none"
      className="task-picker-popup"
      onClose={onClose}
    >
      <div className="w-64 overflow-hidden rounded-xl border border-zinc-200 bg-white font-sans text-sm leading-5 shadow-lg dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40">
        <div className="flex items-center gap-1.5 border-zinc-100 border-b px-3 py-2 dark:border-slate-800">
          <MapPin aria-hidden="true" className="size-3.5 text-zinc-400 dark:text-slate-500" />
          <p className="font-semibold text-xs text-zinc-600 dark:text-slate-300">
            {t(
              'map.taskPicker.heading',
              { count: picker.total },
              '{count, plural, one {# task here} other {# tasks here}}'
            )}
          </p>
        </div>
        <ul
          className="max-h-[9.5rem] overflow-y-auto overscroll-contain p-1"
          aria-label={t('map.taskPicker.label', undefined, 'Tasks at this spot')}
        >
          {picker.markers.map((marker) => (
            <li key={marker.id}>
              <button
                type="button"
                onClick={() => onSelect(marker)}
                className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-zinc-900 transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none dark:text-slate-100 dark:focus-visible:bg-slate-800 dark:hover:bg-slate-800"
              >
                <span className="font-medium tabular-nums">
                  {t('map.taskPicker.task', { taskId: marker.id }, 'Task #{taskId}')}
                </span>
                <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 group-hover:bg-white group-focus-visible:bg-white dark:bg-slate-800 dark:text-slate-300 dark:group-focus-visible:bg-slate-900 dark:group-hover:bg-slate-900">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                    style={{
                      backgroundColor: (STATUS_CONFIG[marker.status] ?? STATUS_CONFIG[0]).color,
                    }}
                  />
                  {getStatusLabel(t, marker.status) ?? t('common.unknown', undefined, 'Unknown')}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-zinc-300 group-hover:text-zinc-500 dark:text-slate-600 dark:group-hover:text-slate-400"
                />
              </button>
            </li>
          ))}
        </ul>
        {picker.total > picker.markers.length && (
          <p className="border-zinc-100 border-t px-3 py-2 text-xs text-zinc-500 dark:border-slate-800 dark:text-slate-400">
            {t(
              'map.taskPicker.more',
              { count: picker.total - picker.markers.length },
              '{count, plural, one {# more task not listed} other {# more tasks not listed}}'
            )}
          </p>
        )}
      </div>
    </Popup>
  )
}
