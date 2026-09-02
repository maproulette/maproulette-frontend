import { ChevronDown, Lasso, RotateCcw, Trash2, Users } from 'lucide-react'
import { useState } from 'react'
import {
  MAX_SELECTED_TASKS,
  useTaskMapContext,
} from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { DocsLink } from '@/components/shared/DocsLink'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { useTaskBundleContext } from '../contexts/TaskBundleContext'
import { useTaskEditMapContext } from './TaskEditMapContext'

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
      className="rounded-lg bg-white/90 shadow-sm backdrop-blur-sm dark:bg-slate-800/90"
    >
      {/* Header - always visible, clickable to expand/collapse */}
      <CollapsibleTrigger className="flex h-10 w-full items-center justify-between gap-2 rounded-lg px-3 transition-colors hover:bg-zinc-50 dark:hover:bg-slate-700/50">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-sm text-zinc-700 dark:text-zinc-200">
            {activeBundle ? (
              <>
                {t(
                  'taskMap.multiTaskPanel.workingOnTasks',
                  { count: activeBundle.taskIds.length },
                  '{count, plural, one {Working on # task} other {Working on # tasks}}'
                )}
                <span className="ml-1 text-zinc-400">
                  {t('taskMap.multiTaskPanel.maxBadge', { max: MAX_SELECTED_TASKS }, '({max} max)')}
                </span>
              </>
            ) : (
              t('taskMap.multiTaskPanel.title', undefined, 'Work on multiple tasks')
            )}
          </span>
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-zinc-400 transition-transform',
            multiTaskPanelOpen && 'rotate-180'
          )}
        />
      </CollapsibleTrigger>

      {/* Expandable content */}
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <div className="flex flex-col gap-2 border-zinc-200 border-t px-3 pt-2 pb-3 dark:border-slate-700">
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
                ? 'bg-blue-500 text-white'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-slate-700 dark:text-zinc-200 dark:hover:bg-slate-600'
            )}
            title={
              activeBundle && activeBundle.taskIds.length >= MAX_SELECTED_TASKS
                ? t('taskMap.multiTaskPanel.maxReached', undefined, 'Maximum tasks reached')
                : t('taskMap.multiTaskPanel.drawTooltip', undefined, 'Draw to add tasks (D)')
            }
          >
            <Lasso className="h-4 w-4" />
            {drawingMode === 'select'
              ? t('taskMap.multiTaskPanel.drawing', undefined, 'Drawing...')
              : t('taskMap.multiTaskPanel.drawButton', undefined, 'Draw to add tasks')}
          </button>

          {/* Clear all - only show when there's a bundle */}
          {activeBundle && (
            <button
              type="button"
              onClick={handleClearBundle}
              className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-red-600 text-sm transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
              {t('taskMap.multiTaskPanel.clearAll', undefined, 'Work on only the primary task')}
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
                className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-sm text-zinc-600 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-slate-700"
              >
                <RotateCcw className="h-4 w-4" />
                {t('taskMap.multiTaskPanel.resetBundle', undefined, 'Reset to initial bundle')}
              </button>
            )}

          <DocsLink page="solvingMultipleTasksTogether" className="px-3 text-xs">
            {t(
              'taskMap.multiTaskPanel.docsLink',
              undefined,
              'Learn about solving multiple tasks together'
            )}
          </DocsLink>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
