import { ChevronDown, MousePointerClick, Package, PanelRight, Star } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import { useOptionalEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import { useOptionalTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useOptionalTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/Task'
import { FeatureProperties, useMeasuredWidth } from '../FeatureProperties'
import { getTaskFeatureGroups } from '../taskUtils/geometryUtils'
import { useBundleTaskIds } from '../useBundleTaskIds'

/**
 * Every task being worked on at once — the task this panel is for, plus the
 * rest of its bundle — as dropdowns listing each task's features and their
 * properties. This is also where a bundle is navigated: opening one of its
 * tasks, highlighting it on the map, or selecting it in the iD editor.
 */

/** Map/editor highlighting, available only inside the task editor. */
const useTaskHighlighting = () => {
  const editor = useOptionalEditorContext()
  const taskMap = useOptionalTaskMapContext()

  const highlight = (taskId: number | null) => {
    taskMap?.setHoveredBundleTaskId(taskId)
    if (editor?.activeView !== 'id') return
    const osmId = taskId != null ? (editor.taskToOsmIdRef.current?.[taskId] ?? null) : null
    editor.highlightIdEntityRef.current?.(osmId)
  }

  const selectInEditor = (taskIds: number[]) => {
    if (editor?.activeView !== 'id') return
    const osmIds = taskIds
      .map((id) => editor.taskToOsmIdRef.current?.[id])
      .filter((id): id is string => !!id)
    if (osmIds.length > 0) editor.selectIdEntitiesRef.current?.(osmIds)
  }

  return {
    inIdEditor: editor?.activeView === 'id',
    highlight,
    selectInEditor,
    handlers: (taskId: number) => ({
      onMouseEnter: () => highlight(taskId),
      onMouseLeave: () => highlight(null),
      onFocus: () => highlight(taskId),
      onBlur: () => highlight(null),
    }),
  }
}

const TaskFeatures = ({
  taskId,
  isPrimary,
  defaultOpen,
  containerWidth,
  onOpenTask,
}: {
  taskId: number
  isPrimary: boolean
  defaultOpen: boolean
  containerWidth: number | null
  onOpenTask?: (taskId: number) => void
}) => {
  const { t } = useIntl()
  const [open, setOpen] = useState(defaultOpen)
  const { inIdEditor, selectInEditor, handlers } = useTaskHighlighting()
  // `getTask` already returns the generated task type, narrowed in @/types/Task
  const { data: task } = api.task.getTask(taskId)
  const groups = task ? getTaskFeatureGroups(task) : []

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-zinc-200 dark:border-slate-700"
      {...handlers(taskId)}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 text-left transition-colors hover:text-zinc-900 dark:hover:text-white">
          {isPrimary ? (
            <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-500 text-yellow-500" />
          ) : (
            <Package className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-slate-400" />
          )}
          <span className="font-medium text-sm text-zinc-900 dark:text-white">
            {t('common.taskWithId', { id: taskId }, 'Task #{id}')}
          </span>
          {isPrimary && (
            <span className="font-medium text-[10px] text-yellow-600 dark:text-yellow-400">
              {t('common.primary', undefined, 'Primary')}
            </span>
          )}
          <span className="text-xs text-zinc-500 dark:text-slate-400">
            {task
              ? t(
                  'taskInfoPanel.features.featureCount',
                  { count: groups.length },
                  '{count} features'
                )
              : t('common.loading', undefined, 'Loading...')}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-zinc-400 transition-transform',
              open && 'rotate-180'
            )}
          />
        </CollapsibleTrigger>

        <div className="flex shrink-0 items-center gap-1">
          {inIdEditor && (
            <button
              type="button"
              onClick={() => selectInEditor([taskId])}
              {...handlers(taskId)}
              className="rounded p-1 text-blue-500 transition-colors hover:bg-blue-50 hover:text-blue-700 dark:text-blue-400 dark:hover:bg-blue-950/30 dark:hover:text-blue-300"
              title={t(
                'taskInfoPanel.taskTab.bundleList.selectTaskTitle',
                { id: taskId },
                'Select Task #{id} in iD editor'
              )}
            >
              <MousePointerClick className="h-3.5 w-3.5" />
            </button>
          )}
          {onOpenTask && !isPrimary && (
            <button
              type="button"
              onClick={() => onOpenTask(taskId)}
              {...handlers(taskId)}
              className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              title={t('taskInfoPanel.features.openTask', { id: taskId }, 'Open Task #{id}')}
              aria-label={t('taskInfoPanel.features.openTask', { id: taskId }, 'Open Task #{id}')}
            >
              <PanelRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <div className="space-y-2 border-zinc-200 border-t px-3 py-3 dark:border-slate-700">
          {groups.length === 0 ? (
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              {task
                ? t(
                    'taskInfoPanel.features.noFeatures',
                    undefined,
                    'This task carries no features.'
                  )
                : t('common.loading', undefined, 'Loading...')}
            </p>
          ) : (
            groups.map((group) => (
              <FeatureProperties
                key={group.key}
                group={group}
                showFocusToggle={groups.length > 1}
                containerWidth={containerWidth}
              />
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

interface FeaturesTabProps {
  /** The task this panel is showing. */
  task: Task
}

export const FeaturesTab = ({ task }: FeaturesTabProps) => {
  const { t } = useIntl()
  const { containerRef, containerWidth } = useMeasuredWidth()
  const { inIdEditor, selectInEditor } = useTaskHighlighting()
  const bundleContext = useOptionalTaskBundleContext()
  const taskIds = useBundleTaskIds(task)
  const isBundled = taskIds.length > 1
  // Only the primary task's panel can drive the drawer; a drawer showing a
  // bundled task would otherwise replace itself.
  const isPrimaryTask = bundleContext ? task.id === bundleContext.activeBundle?.taskIds[0] : false
  const onOpenTask = isPrimaryTask ? bundleContext?.setDrawerTaskId : undefined

  return (
    <div ref={containerRef} className="space-y-2">
      {isBundled && (
        <div className="flex items-center gap-2 pb-1">
          <Package className="h-3.5 w-3.5 text-zinc-400 dark:text-slate-500" />
          <span className="font-medium text-xs text-zinc-500 uppercase tracking-wide dark:text-slate-400">
            {t('common.bundledTasks', { count: taskIds.length }, 'Bundled Tasks ({count})')}
          </span>
          {inIdEditor && (
            <button
              type="button"
              onClick={() => selectInEditor(taskIds)}
              className="ml-auto flex items-center gap-1 rounded-md px-2 py-0.5 font-medium text-[10px] text-blue-600 transition-colors hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/30"
              title={t(
                'taskInfoPanel.taskTab.bundleList.selectAllTitle',
                undefined,
                'Select all bundled tasks in iD editor'
              )}
            >
              <MousePointerClick className="h-3 w-3" />
              {t('taskInfoPanel.taskTab.bundleList.selectAll', undefined, 'Select All')}
            </button>
          )}
        </div>
      )}
      {taskIds.map((taskId) => (
        <TaskFeatures
          key={taskId}
          taskId={taskId}
          isPrimary={taskId === task.id}
          // The task the panel is about opens expanded; its bundle mates start
          // collapsed so a large bundle stays scannable.
          defaultOpen={taskId === task.id}
          containerWidth={containerWidth}
          onOpenTask={onOpenTask}
        />
      ))}
    </div>
  )
}
