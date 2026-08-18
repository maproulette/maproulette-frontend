import { MousePointerClick, Package, Star } from 'lucide-react'
import { useEditorContext } from '@/components/Pages/TaskEditPage/contexts/EditorContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { useIntl } from '@/i18n'

interface BundleTaskListProps {
  taskIds: number[]
  primaryTaskId: number
  onOpenBundleTask?: (taskId: number) => void
}

export const BundleTaskList = ({
  taskIds,
  primaryTaskId,
  onOpenBundleTask,
}: BundleTaskListProps) => {
  const { t } = useIntl()
  const { highlightIdEntityRef, taskToOsmIdRef, selectIdEntitiesRef, activeView } =
    useEditorContext()
  const { setHoveredBundleTaskId } = useTaskMapContext()

  const highlightTask = (taskId: number | null) => {
    setHoveredBundleTaskId(taskId)
    if (activeView !== 'id') return
    const osmId = taskId != null ? (taskToOsmIdRef.current?.[taskId] ?? null) : null
    highlightIdEntityRef.current?.(osmId)
  }

  const selectTaskInEditor = (taskId: number) => {
    if (activeView !== 'id') return
    const osmId = taskToOsmIdRef.current?.[taskId]
    if (osmId) {
      selectIdEntitiesRef.current?.([osmId])
    }
  }

  const selectAllInEditor = () => {
    if (activeView !== 'id') return
    const osmIds = taskIds
      .map((id) => taskToOsmIdRef.current?.[id])
      .filter((id): id is string => !!id)
    if (osmIds.length > 0) {
      selectIdEntitiesRef.current?.(osmIds)
    }
  }

  const highlightHandlers = (taskId: number) => ({
    onMouseEnter: () => highlightTask(taskId),
    onMouseLeave: () => highlightTask(null),
    onFocus: () => highlightTask(taskId),
    onBlur: () => highlightTask(null),
  })

  if (taskIds.length === 0) return null

  return (
    <div>
      <div className="flex items-center gap-2 pb-2">
        <Package className="h-3.5 w-3.5 text-zinc-400 dark:text-slate-500" />
        <span className="font-medium text-xs text-zinc-500 uppercase tracking-wide dark:text-slate-400">
          {t('common.bundledTasks', { count: taskIds.length }, 'Bundled Tasks ({count})')}
        </span>
        {activeView === 'id' && (
          <button
            type="button"
            onClick={selectAllInEditor}
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
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {taskIds.map((taskId) => {
          const isPrimary = taskId === primaryTaskId
          return (
            <div
              key={taskId}
              className="flex h-8 w-full items-center rounded-lg border border-zinc-200 bg-zinc-50 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
            >
              <button
                type="button"
                onClick={() => {
                  if (isPrimary) return
                  onOpenBundleTask?.(taskId)
                }}
                {...highlightHandlers(taskId)}
                className="flex flex-1 items-center gap-1.5 px-3 text-left text-sm"
              >
                {isPrimary && <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />}
                <span className="font-medium text-xs text-zinc-600 dark:text-slate-300">
                  {t('common.taskWithId', { id: taskId }, 'Task #{id}')}
                </span>
                {isPrimary && (
                  <span className="font-medium text-[10px] text-yellow-600 dark:text-yellow-400">
                    {t('common.primary', undefined, 'Primary')}
                  </span>
                )}
              </button>
              {activeView === 'id' && (
                <button
                  type="button"
                  onClick={() => selectTaskInEditor(taskId)}
                  {...highlightHandlers(taskId)}
                  className="flex items-center gap-1 px-2 text-blue-500 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                  title={t(
                    'taskInfoPanel.taskTab.bundleList.selectTaskTitle',
                    { id: taskId },
                    'Select Task #{id} in iD editor'
                  )}
                >
                  <MousePointerClick className="h-3 w-3" />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
