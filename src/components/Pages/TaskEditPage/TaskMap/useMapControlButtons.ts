import { Crosshair, Eye, EyeOff, Filter, Globe } from 'lucide-react'
import { useMemo } from 'react'
import { directionsControlButton } from '@/components/Map/directionsControlButton'
import type { MapControlButton } from '@/components/Map/MapControls'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskFeatureContext } from '@/components/Pages/TaskEditPage/contexts/TaskFeatureContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { useIntl } from '@/i18n'
import { useTaskEditMapContext } from './TaskEditMapContext'
import { MAP_BINDINGS } from './useTaskMapShortcuts'

export const useMapControlButtons = (
  mapLoaded: boolean,
  handleCenterToTask: () => void
): MapControlButton[] => {
  const { markersHidden, setMarkersHidden } = useTaskMapContext()
  const { activeBundle, showBundleOnly, setShowBundleOnly } = useTaskBundleContext()
  const { showExploreLayer, setShowExploreLayer } = useTaskEditMapContext()
  const { showDirectionIndicators, setShowDirectionIndicators } = useTaskFeatureContext()
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
      {
        id: 'toggle-markers',
        icon: markersHidden ? EyeOff : Eye,
        onClick: () => setMarkersHidden(!markersHidden),
        tooltip: markersHidden
          ? t({ id: 'taskMap.controls.showAllMarkers', defaultMessage: 'Show all markers' })
          : t({ id: 'taskMap.controls.hideAllMarkers', defaultMessage: 'Hide all markers' }),
        disabled: !mapLoaded,
        isActive: markersHidden,
        binding: MAP_BINDINGS.toggleMarkers,
      },
      {
        id: 'toggle-bundle-only',
        icon: Filter,
        onClick: () => setShowBundleOnly(!showBundleOnly),
        tooltip: showBundleOnly
          ? t({ id: 'taskMap.controls.showAllTasks', defaultMessage: 'Show all tasks' })
          : activeBundle
            ? t({ id: 'taskMap.controls.showSelectedOnly', defaultMessage: 'Show selected tasks only' })
            : t({ id: 'taskMap.controls.showPrimaryOnly', defaultMessage: 'Show primary task only' }),
        disabled: !mapLoaded,
        isActive: showBundleOnly,
        binding: MAP_BINDINGS.toggleBundleOnly,
      },
      directionsControlButton({
        show: showDirectionIndicators,
        onToggle: setShowDirectionIndicators,
        disabled: !mapLoaded,
        t,
      }),
      {
        id: 'toggle-explore-layer',
        icon: Globe,
        onClick: () => setShowExploreLayer(!showExploreLayer),
        tooltip: showExploreLayer
          ? t({ id: 'taskMap.controls.hideOtherChallenges', defaultMessage: 'Hide tasks from other challenges' })
          : t({ id: 'taskMap.controls.showOtherChallenges', defaultMessage: 'Show tasks from other challenges' }
            ),
        disabled: !mapLoaded,
        isActive: showExploreLayer,
        binding: MAP_BINDINGS.toggleExploreLayer,
      },
    ],
    [
      mapLoaded,
      handleCenterToTask,
      markersHidden,
      setMarkersHidden,
      activeBundle,
      showBundleOnly,
      setShowBundleOnly,
      showExploreLayer,
      setShowExploreLayer,
      showDirectionIndicators,
      setShowDirectionIndicators,
      t,
    ]
  )
}
