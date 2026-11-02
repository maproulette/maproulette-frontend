import { useMemo } from 'react'
import { DIRECTIONS_BINDING } from '@/components/Map/directionsControlButton'
import { type KeyboardShortcut, useRegisterShortcuts } from '@/contexts/KeyboardShortcutsContext'
import { useIntl } from '@/i18n'
import type { ShortcutBinding } from '@/lib/keyboardShortcuts'
import { useEditorContext } from '../contexts/EditorContext'
import { useTaskBundleContext } from '../contexts/TaskBundleContext'
import { useTaskFeatureContext } from '../contexts/TaskFeatureContext'
import { useTaskMapContext } from '../contexts/TaskMapContext'
import { useTaskEditMapContext } from './TaskEditMapContext'

/**
 * Map and multi-task bindings.
 *
 * The zoom and fit keys are MapRoulette 3's. The rest sit on keys 3 never
 * used, because the letters it did use are spoken for: `f` and `d` are task
 * statuses, so the bundle filter and the selection lasso moved to `b` and
 * `Shift+B`, and marker visibility moved off `h` (which 3 used for the
 * previous task) to `m`.
 */
export const MAP_BINDINGS = {
  zoomIn: { key: '+', aliases: ['='] },
  zoomOut: { key: '-', aliases: ['_'] },
  fitToTask: { key: '0' },
  toggleMarkers: { key: 'm' },
  toggleBundleOnly: { key: 'b' },
  toggleExploreLayer: { key: 'o', shift: true },
  toggleDirectionIndicators: DIRECTIONS_BINDING,
  startDrawing: { key: 'b', shift: true },
  exitMultiTask: { key: 'Delete' },
  cancel: { key: 'Esc' },
} satisfies Record<string, ShortcutBinding>

export const useTaskMapShortcuts = (fitToTask: () => void) => {
  const { activeBundle, showBundleOnly, setShowBundleOnly, setShowDeleteDialog } =
    useTaskBundleContext()
  const { map, markersHidden, setMarkersHidden, drawingMode, startDrawing, cancelDrawing } =
    useTaskMapContext()
  // The loaded flag every one of these shortcuts gates on comes from
  // TaskEditMapContext: that is the one <MapGL onLoad> sets.
  const { showExploreLayer, setShowExploreLayer, mapLoaded } = useTaskEditMapContext()
  const { showDirectionIndicators, setShowDirectionIndicators } = useTaskFeatureContext()
  const { activeView, showMap } = useEditorContext()
  const { t } = useIntl()

  // Reason: stable shortcut definitions for keyboard handler registration
  const taskMapShortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        ...MAP_BINDINGS.zoomIn,
        description: t({ id: 'map.controls.zoomIn', defaultMessage: 'Zoom in' }),
        category: 'map',
        handler: () => map.current?.getMap()?.zoomIn({ duration: 0 }),
        enabled: mapLoaded,
      },
      {
        ...MAP_BINDINGS.zoomOut,
        description: t({ id: 'map.controls.zoomOut', defaultMessage: 'Zoom out' }),
        category: 'map',
        handler: () => map.current?.getMap()?.zoomOut({ duration: 0 }),
        enabled: mapLoaded,
      },
      {
        ...MAP_BINDINGS.fitToTask,
        description: t({ id: 'taskMap.controls.centerToTask', defaultMessage: 'Center to Task' }),
        category: 'map',
        handler: fitToTask,
        enabled: mapLoaded,
      },
      {
        ...MAP_BINDINGS.toggleMarkers,
        description: t({ id: 'taskMap.shortcuts.toggleMarkers', defaultMessage: 'Toggle all markers visibility' }
        ),
        category: 'map',
        handler: () => setMarkersHidden(!markersHidden),
        enabled: mapLoaded,
      },
      {
        ...MAP_BINDINGS.toggleExploreLayer,
        description: t({ id: 'taskMap.shortcuts.toggleExploreLayer', defaultMessage: 'Toggle tasks from other challenges' }
        ),
        category: 'map',
        handler: () => setShowExploreLayer(!showExploreLayer),
        enabled: mapLoaded,
      },
      {
        // MapRoulette 3 replayed its line-drawing animation on this key; here
        // it turns the standing direction indicators off and on instead.
        ...MAP_BINDINGS.toggleDirectionIndicators,
        description: t({ id: 'taskMap.shortcuts.toggleDirectionIndicators', defaultMessage: 'Toggle direction indicators on task geometry' }
        ),
        category: 'map',
        handler: () => setShowDirectionIndicators(!showDirectionIndicators),
        enabled: mapLoaded,
      },
      {
        ...MAP_BINDINGS.toggleBundleOnly,
        description: t({ id: 'taskMap.shortcuts.toggleFilter', defaultMessage: 'Toggle filter (show bundled tasks only)' }
        ),
        category: 'map',
        handler: () => setShowBundleOnly(!showBundleOnly),
        enabled: !!activeBundle,
        disabledReason: t({ id: 'keyboardShortcuts.unavailable.noSelection', defaultMessage: 'Select more than one task first' }
        ),
      },
      {
        ...MAP_BINDINGS.startDrawing,
        description: t({ id: 'taskMap.shortcuts.startDrawing', defaultMessage: 'Start drawing to add tasks' }),
        category: 'multiTask',
        handler: () => startDrawing('select'),
        enabled: !drawingMode,
        disabledReason: t({ id: 'keyboardShortcuts.unavailable.alreadyDrawing', defaultMessage: 'Already drawing' }
        ),
      },
      {
        ...MAP_BINDINGS.exitMultiTask,
        description: t({ id: 'taskMap.shortcuts.exitMultiTask', defaultMessage: 'Exit multi-task mode' }),
        category: 'multiTask',
        handler: () => setShowDeleteDialog(true),
        enabled: !!activeBundle,
        disabledReason: t({ id: 'keyboardShortcuts.unavailable.noSelection', defaultMessage: 'Select more than one task first' }
        ),
      },
      {
        ...MAP_BINDINGS.cancel,
        description: t({ id: 'taskMap.shortcuts.cancelDrawing', defaultMessage: 'Cancel drawing' }),
        category: 'multiTask',
        handler: cancelDrawing,
        enabled: !!drawingMode,
        // Wins over closing the editor: a mapper mid-lasso means the lasso.
        priority: 1,
      },
      {
        ...MAP_BINDINGS.cancel,
        description: t({ id: 'taskEditPage.shortcuts.backToMap', defaultMessage: 'Close the editor' }),
        category: 'editors',
        handler: showMap,
        enabled: activeView === 'id' && !drawingMode,
      },
    ],
    [
      map,
      mapLoaded,
      fitToTask,
      activeBundle,
      showBundleOnly,
      setShowBundleOnly,
      markersHidden,
      setMarkersHidden,
      showExploreLayer,
      setShowExploreLayer,
      showDirectionIndicators,
      setShowDirectionIndicators,
      drawingMode,
      cancelDrawing,
      startDrawing,
      setShowDeleteDialog,
      activeView,
      showMap,
      t,
    ]
  )

  useRegisterShortcuts('task-map', taskMapShortcuts)
}
