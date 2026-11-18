import { ChevronDown, MousePointerClick, Package, PanelRight, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { api } from '@/api'
import { useOptionalEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import { useOptionalTaskBundleContext } from '@/components/Pages/TaskEditPage/contexts/TaskBundleContext'
import { useOptionalTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/Task'
import { FeatureProperties, useMeasuredWidth } from '../FeatureProperties'
import { countTaskFeatures, getTaskFeatureGroups } from '../taskUtils/geometryUtils'
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
  const groups = useMemo(() => (task ? getTaskFeatureGroups(task) : []), [task])
  const featureCount = countTaskFeatures(groups)

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="rounded-lg border border-line"
      {...handlers(taskId)}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <CollapsibleTrigger className="flex min-w-0 flex-1 items-center gap-2 text-left transition-colors hover:text-fg">
          {isPrimary ? (
            <Star className="h-3.5 w-3.5 shrink-0 fill-mango-500 text-mango-500" />
          ) : (
            <Package className="h-3.5 w-3.5 shrink-0 text-fg-muted" />
          )}
          <span className="font-medium text-fg text-sm">
            {t({ id: 'common.taskWithId', defaultMessage: 'Task #{id}' }, { id: taskId })}
          </span>
          {isPrimary && (
            <span className="font-medium text-[10px] text-warning">
              {t({ id: 'common.primary', defaultMessage: 'Primary' })}
            </span>
          )}
          <span className="text-fg-muted text-xs">
            {task
              ? t(
                  {
                    id: 'taskInfoPanel.features.featureCount',
                    defaultMessage: '{count, plural, one {# feature} other {# features}}',
                  },
                  { count: featureCount }
                )
              : t({ id: 'common.loading', defaultMessage: 'Loading…' })}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-fg-subtle transition-transform',
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
              className="rounded p-1 text-link transition-colors hover:bg-muted"
              title={t(
                {
                  id: 'taskInfoPanel.taskTab.bundleList.selectTaskTitle',
                  defaultMessage: 'Select Task #{id} in iD editor',
                },
                { id: taskId }
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
              className="rounded p-1 text-fg-muted transition-colors hover:bg-muted hover:text-fg"
              title={t(
                { id: 'taskInfoPanel.features.openTask', defaultMessage: 'Open Task #{id}' },
                { id: taskId }
              )}
              aria-label={t(
                { id: 'taskInfoPanel.features.openTask', defaultMessage: 'Open Task #{id}' },
                { id: taskId }
              )}
            >
              <PanelRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <div className="space-y-2 border-line border-t px-3 py-3">
          {groups.length === 0 ? (
            <p className="text-fg-muted text-xs">
              {task
                ? t({
                    id: 'taskInfoPanel.features.noFeatures',
                    defaultMessage: 'This task carries no features.',
                  })
                : t({ id: 'common.loading', defaultMessage: 'Loading…' })}
            </p>
          ) : (
            groups.map((group) => (
              <FeatureProperties
                key={group.nodeKey}
                group={group}
                showFocusToggle={featureCount > 1}
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
          <Package className="h-3.5 w-3.5 text-fg-subtle" />
          <span className="font-medium text-fg-muted text-xs uppercase tracking-wide">
            {t(
              { id: 'common.bundledTasks', defaultMessage: 'Bundled Tasks ({count})' },
              { count: taskIds.length }
            )}
          </span>
          {inIdEditor && (
            <button
              type="button"
              onClick={() => selectInEditor(taskIds)}
              className="ml-auto flex items-center gap-1 rounded-md px-2 py-0.5 font-medium text-[10px] text-link transition-colors hover:bg-muted"
              title={t({
                id: 'taskInfoPanel.taskTab.bundleList.selectAllTitle',
                defaultMessage: 'Select all bundled tasks in iD editor',
              })}
            >
              <MousePointerClick className="h-3 w-3" />
              {t({
                id: 'taskInfoPanel.taskTab.bundleList.selectAll',
                defaultMessage: 'Select All',
              })}
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
