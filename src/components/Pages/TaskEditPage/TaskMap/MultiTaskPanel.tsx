import { ChevronDown, Lasso, RotateCcw, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import {
  MAX_SELECTED_TASKS,
  useTaskMapContext,
} from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { DocsLink } from '@/components/shared/DocsLink'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { useIntl } from '@/i18n'
import { withBindingHint } from '@/lib/keyboardShortcuts'
import { cn } from '@/lib/utils'
import { useTaskBundleContext } from '../contexts/TaskBundleContext'
import { useTaskEditMapContext } from './TaskEditMapContext'
import { MAP_BINDINGS } from './useTaskMapShortcuts'

export const MultiTaskPanel = () => {
  const { activeBundle, initialBundle } = useTaskBundleContext()
  const { drawingMode, startDrawing, cancelDrawing } = useTaskMapContext()
  const { mapLoaded } = useTaskEditMapContext()
  const { resetBundle, handleClearBundle } = useTaskBundleContext()
  const [multiTaskPanelOpen, setMultiTaskPanelOpen] = useState(false)
  const { t } = useIntl()

  return (
    <Collapsible
      open={multiTaskPanelOpen}
      onOpenChange={setMultiTaskPanelOpen}
      className="rounded-lg border border-line bg-popover shadow-md"
    >
      {/* Header - always visible, clickable to expand/collapse */}
      <CollapsibleTrigger className="flex h-10 w-full items-center justify-between gap-2 rounded-lg px-3 transition-colors hover:bg-muted">
        <span className="flex items-center gap-2">
          <Users className="h-4 w-4 text-fg-subtle" />
          <span className="font-medium text-fg text-sm">
            {activeBundle ? (
              <>
                {t(
                  {
                    id: 'taskMap.multiTaskPanel.workingOnTasks',
                    defaultMessage:
                      '{count, plural, one {Working on # task} other {Working on # tasks}}',
                  },
                  { count: activeBundle.taskIds.length }
                )}
                <span className="ml-1 text-fg-subtle">
                  {t(
                    { id: 'taskMap.multiTaskPanel.maxBadge', defaultMessage: '({max} max)' },
                    { max: MAX_SELECTED_TASKS }
                  )}
                </span>
              </>
            ) : (
              t({ id: 'taskMap.multiTaskPanel.title', defaultMessage: 'Work on multiple tasks' })
            )}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-fg-subtle transition-transform',
            multiTaskPanelOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>

      {/* Expandable content */}
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <div className="flex flex-col gap-2 border-line border-t px-3 pt-2 pb-3">
          {/* Lasso tool */}
          <button
            type="button"
            onClick={() => {
              if (drawingMode === 'select') {
                cancelDrawing()
              } else {
                startDrawing('select')
              }
            }}
            disabled={
              !mapLoaded ||
              (activeBundle ? activeBundle.taskIds.length >= MAX_SELECTED_TASKS : false)
            }
            className={cn(
              'flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
              drawingMode === 'select'
                ? 'bg-accent text-accent-fg'
                : 'bg-muted text-fg hover:bg-muted-strong'
            )}
            title={
              activeBundle && activeBundle.taskIds.length >= MAX_SELECTED_TASKS
                ? t({
                    id: 'taskMap.multiTaskPanel.maxReached',
                    defaultMessage: 'Maximum tasks reached',
                  })
                : withBindingHint(
                    t({
                      id: 'taskMap.multiTaskPanel.drawButton',
                      defaultMessage: 'Draw to add tasks',
                    }),
                    MAP_BINDINGS.startDrawing
                  )
            }
          >
            <Lasso className="h-4 w-4" />
            {drawingMode === 'select'
              ? t({ id: 'taskMap.multiTaskPanel.drawing', defaultMessage: 'Drawing...' })
              : t({ id: 'taskMap.multiTaskPanel.drawButton', defaultMessage: 'Draw to add tasks' })}
          </button>

          {/* Clear all - only show when there's a bundle */}
          {activeBundle && (
            <button
              type="button"
              onClick={handleClearBundle}
              className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-danger text-sm transition-colors hover:bg-danger/10"
            >
              <Trash2 className="h-4 w-4" />
              {t({
                id: 'taskMap.multiTaskPanel.clearAll',
                defaultMessage: 'Work on only the primary task',
              })}
            </button>
          )}

          {/* Reset to initial bundle - show when there was an initial bundle and current state differs */}
          {initialBundle &&
            (!activeBundle ||
              activeBundle.bundleId !== initialBundle.bundleId ||
              activeBundle.taskIds.length !== initialBundle.taskIds.length ||
              !activeBundle.taskIds.every((id) => initialBundle.taskIds.includes(id))) && (
              <button
                type="button"
                onClick={() => resetBundle()}
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-fg-muted text-sm transition-colors hover:bg-muted-strong"
              >
                <RotateCcw className="h-4 w-4" />
                {t({
                  id: 'taskMap.multiTaskPanel.resetBundle',
                  defaultMessage: 'Reset to initial bundle',
                })}
              </button>
            )}

          <DocsLink page="solvingMultipleTasksTogether" className="px-3 text-xs">
            {t({
              id: 'taskMap.multiTaskPanel.docsLink',
              defaultMessage: 'Learn about solving multiple tasks together',
            })}
          </DocsLink>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
