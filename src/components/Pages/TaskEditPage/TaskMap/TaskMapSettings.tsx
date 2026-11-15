import { DirectionsSetting } from '@/components/Map/directions'
import {
  MapSettingRadioGroup,
  MapSettingSwitch,
  MapSettingsSection,
} from '@/components/Map/MapSettings'
import { useTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useTaskFeatureContext } from '@/components/Pages/TaskEditPage/contexts/TaskFeatureContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { useIntl } from '@/i18n'
import { useTaskEditMapContext } from './TaskEditMapContext'
import { MAP_BINDINGS } from './useTaskMapShortcuts'

type MarkersShown = 'all' | 'bundle' | 'none'

/** Whether any current task map setting is different from its default value */
export const useTaskMapSettingsModified = () => {
  const { markersHidden } = useTaskMapContext()
  const { showBundleOnly } = useTaskBundleContext()
  const { showExploreLayer } = useTaskEditMapContext()
  const { showDirectionIndicators } = useTaskFeatureContext()
  return markersHidden || showBundleOnly || showExploreLayer || !showDirectionIndicators
}

export const TaskMapSettings = () => {
  const { t } = useIntl()
  const { markersHidden, setMarkersHidden } = useTaskMapContext()
  const { activeBundle, showBundleOnly, setShowBundleOnly } = useTaskBundleContext()
  const { showExploreLayer, setShowExploreLayer } = useTaskEditMapContext()
  const { showDirectionIndicators, setShowDirectionIndicators } = useTaskFeatureContext()

  const markersShown: MarkersShown = markersHidden ? 'none' : showBundleOnly ? 'bundle' : 'all'

  const setMarkersShown = (value: MarkersShown) => {
    setMarkersHidden(value === 'none')
    setShowBundleOnly(value === 'bundle')
  }

  const markersTitle = t({ id: 'taskMap.settings.markers', defaultMessage: 'Task markers' })

  return (
    <>
      <MapSettingsSection title={markersTitle}>
        <MapSettingRadioGroup
          label={markersTitle}
          value={markersShown}
          onValueChange={setMarkersShown}
          options={[
            {
              value: 'all',
              label: t({ id: 'taskMap.settings.markersAll', defaultMessage: 'All tasks' }),
            },
            {
              value: 'bundle',
              label: activeBundle
                ? t({
                    id: 'taskMap.settings.markersSelected',
                    defaultMessage: 'Selected tasks only',
                  })
                : t({ id: 'taskMap.settings.markersPrimary', defaultMessage: 'This task only' }),
              // The shortcut only works with a bundle selected.
              binding: activeBundle ? MAP_BINDINGS.toggleBundleOnly : undefined,
            },
            {
              value: 'none',
              label: t({ id: 'taskMap.settings.markersNone', defaultMessage: 'None' }),
              binding: MAP_BINDINGS.toggleMarkers,
            },
          ]}
        />
      </MapSettingsSection>
      <MapSettingsSection title={t({ id: 'map.settings.overlays', defaultMessage: 'Overlays' })}>
        <DirectionsSetting
          checked={showDirectionIndicators}
          onCheckedChange={setShowDirectionIndicators}
        />
        <MapSettingSwitch
          label={t({
            id: 'taskMap.settings.otherChallenges',
            defaultMessage: 'Tasks from other challenges',
          })}
          checked={showExploreLayer}
          onCheckedChange={setShowExploreLayer}
          binding={MAP_BINDINGS.toggleExploreLayer}
        />
      </MapSettingsSection>
    </>
  )
}
