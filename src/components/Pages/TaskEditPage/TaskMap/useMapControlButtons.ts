import { Crosshair } from 'lucide-react'
import { useMemo } from 'react'
import type { MapControlButton } from '@/components/Map/MapControls'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useIntl } from '@/i18n'
import { MAP_BINDINGS } from './useTaskMapShortcuts'

export const useMapControlButtons = (
  mapLoaded: boolean,
  handleCenterToTask: () => void
): MapControlButton[] => {
  const { activeBundle } = useTaskBundleContext()
  const { t } = useIntl()

  return useMemo(
    () => [
      {
        id: 'center-to-task',
        icon: Crosshair,
        onClick: handleCenterToTask,
        tooltip:
          activeBundle && activeBundle.taskIds.length > 1
            ? t({ id: 'taskMap.controls.centerToBundle', defaultMessage: 'Center to Bundle' })
            : t({ id: 'taskMap.controls.centerToTask', defaultMessage: 'Center to Task' }),
        disabled: !mapLoaded,
        binding: MAP_BINDINGS.fitToTask,
      },
    ],
    [mapLoaded, handleCenterToTask, activeBundle, t]
  )
}
