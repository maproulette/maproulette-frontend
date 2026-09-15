import { Crosshair, Eye, EyeOff, Filter, Globe, MoveRight } from 'lucide-react'
import { useMemo } from 'react'
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
            ? t('taskMap.controls.centerToBundle', undefined, 'Center to Bundle')
            : t('taskMap.controls.centerToTask', undefined, 'Center to Task'),
        disabled: !mapLoaded,
        binding: MAP_BINDINGS.fitToTask,
      },
      {
        id: 'toggle-markers',
        icon: markersHidden ? EyeOff : Eye,
        onClick: () => setMarkersHidden(!markersHidden),
        tooltip: markersHidden
          ? t('taskMap.controls.showAllMarkers', undefined, 'Show all markers')
          : t('taskMap.controls.hideAllMarkers', undefined, 'Hide all markers'),
        disabled: !mapLoaded,
        isActive: markersHidden,
        binding: MAP_BINDINGS.toggleMarkers,
      },
      {
        id: 'toggle-bundle-only',
        icon: Filter,
        onClick: () => setShowBundleOnly(!showBundleOnly),
        tooltip: showBundleOnly
          ? t('taskMap.controls.showAllTasks', undefined, 'Show all tasks')
          : activeBundle
            ? t('taskMap.controls.showSelectedOnly', undefined, 'Show selected tasks only')
            : t('taskMap.controls.showPrimaryOnly', undefined, 'Show primary task only'),
        disabled: !mapLoaded,
        isActive: showBundleOnly,
        binding: MAP_BINDINGS.toggleBundleOnly,
      },
      {
        id: 'toggle-direction-indicators',
        icon: MoveRight,
        onClick: () => setShowDirectionIndicators(!showDirectionIndicators),
        tooltip: showDirectionIndicators
          ? t('taskMap.controls.hideDirectionIndicators', undefined, 'Hide direction indicators')
          : t('taskMap.controls.showDirectionIndicators', undefined, 'Show direction indicators'),
        disabled: !mapLoaded,
        isActive: showDirectionIndicators,
        binding: MAP_BINDINGS.toggleDirectionIndicators,
      },
      {
        id: 'toggle-explore-layer',
        icon: Globe,
        onClick: () => setShowExploreLayer(!showExploreLayer),
        tooltip: showExploreLayer
          ? t('taskMap.controls.hideOtherChallenges', undefined, 'Hide tasks from other challenges')
          : t(
              'taskMap.controls.showOtherChallenges',
              undefined,
              'Show tasks from other challenges'
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
