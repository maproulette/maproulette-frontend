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

export interface TaskPickerState<M extends TaskMarker = TaskMarker> {
  lngLat: [number, number]
  extent: MarkerExtent
  markers: M[]
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

interface TaskPickerMenuProps<M extends TaskMarker> {
  picker: TaskPickerState<M>
  onSelect: (marker: M) => void
  onClose: () => void
}

export const TaskPickerMenu = <M extends TaskMarker>({
  picker,
  onSelect,
  onClose,
}: TaskPickerMenuProps<M>) => {
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
      <div className="w-64 overflow-hidden rounded-xl border border-line bg-popover font-sans text-sm leading-5 shadow-lg">
        <div className="flex items-center gap-1.5 border-line border-b px-3 py-2">
          <MapPin aria-hidden="true" className="size-3.5 text-fg-subtle" />
          <p className="font-semibold text-fg-muted text-xs">
            {t(
              {
                id: 'map.taskPicker.heading',
                defaultMessage: '{count, plural, one {# task here} other {# tasks here}}',
              },
              { count: picker.total }
            )}
          </p>
        </div>
        <ul
          className="max-h-[9.5rem] overflow-y-auto overscroll-contain p-1"
          aria-label={t({ id: 'map.taskPicker.label', defaultMessage: 'Tasks at this spot' })}
        >
          {picker.markers.map((marker) => (
            <li key={marker.id}>
              <button
                type="button"
                onClick={() => onSelect(marker)}
                className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-fg transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <span className="font-medium tabular-nums">
                  {t(
                    { id: 'common.taskWithTaskId', defaultMessage: 'Task #{taskId}' },
                    { taskId: marker.id }
                  )}
                </span>
                <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-fg-muted text-xs group-hover:bg-popover group-focus-visible:bg-popover">
                  <span
                    aria-hidden="true"
                    className="size-2 shrink-0 rounded-full ring-1 ring-black/10 dark:ring-white/20"
                    style={{
                      backgroundColor: (STATUS_CONFIG[marker.status] ?? STATUS_CONFIG[0]).color,
                    }}
                  />
                  {getStatusLabel(t, marker.status) ??
                    t({ id: 'common.unknown', defaultMessage: 'Unknown' })}
                </span>
                <ChevronRight
                  aria-hidden="true"
                  className="size-3.5 shrink-0 text-line-strong group-hover:text-fg-muted"
                />
              </button>
            </li>
          ))}
        </ul>
        {picker.total > picker.markers.length && (
          <p className="border-line border-t px-3 py-2 text-fg-muted text-xs">
            {t(
              {
                id: 'map.taskPicker.more',
                defaultMessage:
                  '{count, plural, one {# more task not listed} other {# more tasks not listed}}',
              },
              { count: picker.total - picker.markers.length }
            )}
          </p>
        )}
      </div>
    </Popup>
  )
}
