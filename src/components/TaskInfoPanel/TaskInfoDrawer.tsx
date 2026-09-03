import { Link, useNavigate } from '@tanstack/react-router'
import { ExternalLink, Package, Play, Share2, X, ZoomIn } from 'lucide-react'
import { useMemo } from 'react'
import type { MapRef } from 'react-map-gl/maplibre'
import ReactMarkdown from 'react-markdown'
import { api } from '@/api'
import { TaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { SharePopoverContent } from '@/components/shared/ShareLink/SharePopoverContent'
import {
  getOsmServerUrl,
  parseOsmFeatureFromTask,
} from '@/components/TaskInfoPanel/taskUtils/osmUtils'
import { substituteTaskProperties } from '@/components/TaskInfoPanel/taskUtils/propertyUtils'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { useDrawerTransition } from '@/hooks/useDrawerTransition'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'
import { useIntl } from '@/i18n'
import { markdownRemarkPlugins } from '@/lib/markdown'
import { getStatusLabel, STATUS_COLORS } from '@/lib/taskConstants'
import { cn } from '@/lib/utils'
import type { Task, TaskMarker } from '@/types/Task'
import { TaskTabs } from './TaskTabs'

const noop = () => {}

interface TaskInfoDrawerProps {
  selectedTask: TaskMarker | null
  onClose: () => void
  mapRef: React.RefObject<MapRef | null>
}

export const TaskInfoDrawer = ({ selectedTask, onClose, mapRef }: TaskInfoDrawerProps) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const navigateToTask = useNavigateToTask()

  const { data: fullTask } = api.task.getTask(selectedTask?.id ?? 0)
  const task = fullTask as Task | undefined

  const { data: challenge } = api.challenge.getChallenge(task?.parent ?? 0)
  const { data: project } = api.project.getProject(challenge?.parent)
  const { data: bundleData } = api.taskBundle.getTaskBundle(task?.bundleId ?? 0)

  const shouldBeOpen = selectedTask !== null
  const targetTaskId = selectedTask?.id ?? null

  const isOpen = useDrawerTransition(shouldBeOpen, targetTaskId)

  const handleStartTask = () => {
    if (task) {
      navigateToTask(task.id)
    }
  }

  const handleZoomToTask = () => {
    if (!mapRef?.current || !selectedTask?.location) return
    mapRef.current.jumpTo({
      center: [selectedTask.location.lng, selectedTask.location.lat],
      zoom: 16,
    })
  }

  const status = task?.status ?? selectedTask?.status ?? 0
  const statusLabel = getStatusLabel(t, status) || t('common.unknown', undefined, 'Unknown')
  const statusColor = STATUS_COLORS[status] || 'bg-zinc-500'

  const osmFeature = task ? parseOsmFeatureFromTask(task) : null
  const osmServer = getOsmServerUrl()
  const osmUrl =
    task?.name && osmFeature
      ? `${osmServer}/${osmFeature.type}/${osmFeature.id}`
      : task?.name && /^(node|way|relation)\/\d+$/.test(String(task.name))
        ? `${osmServer}/${task.name}`
        : task?.name && /^\d+$/.test(String(task.name))
          ? `${osmServer}/way/${task.name}`
          : null

  // Provide a TaskContext so tab descendants (DataTab, CommentsHistoryTab,
  // TaskTab) work outside the task-edit route. Lock-related
  // methods are no-ops here — the drawer is read-only on browse/explore/
  // prioritization pages.
  const taskContextValue = useMemo(
    () =>
      task
        ? {
            task,
            isEditable: false,
            isLocked: false,
            isLocking: false,
            lockedTasks: [],
            lockTask: noop,
            unlockTask: noop,
          }
        : undefined,
    [task]
  )

  return (
    <Drawer open={isOpen} onClose={onClose}>
      {/* Header */}
      <div className="shrink-0 rounded-t-lg border-zinc-200 border-b bg-gradient-to-r from-purple-200 via-purple-100/50 to-transparent px-4 py-3 dark:border-slate-700 dark:from-purple-800/50 dark:via-purple-900/25 dark:to-transparent">
        {/* Info zone: badges row, title, breadcrumb */}
        <div className="space-y-1.5">
          {/* Status badge (left) | icon utilities (right) */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-white text-xs',
                statusColor
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
              {statusLabel}
            </div>
            <div className="ml-auto flex items-center gap-1">
              {selectedTask?.location && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleZoomToTask}
                  aria-label={t('common.zoomToTask', undefined, 'Zoom to task')}
                  title={t('common.zoomToTask', undefined, 'Zoom to task')}
                >
                  <ZoomIn className="size-4" />
                </Button>
              )}
              {task && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={t('common.shareTask', undefined, 'Share task')}
                      title={t('common.shareTask', undefined, 'Share task')}
                    >
                      <Share2 className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80">
                    <SharePopoverContent
                      url={`${window.location.origin}/tasks/${task.id}`}
                      title={
                        task.name
                          ? t('common.taskWithName', { name: task.name }, 'Task: {name}')
                          : t('common.taskWithId', { id: task.id }, 'Task #{id}')
                      }
                      description={challenge?.name}
                    />
                  </PopoverContent>
                </Popover>
              )}
              {osmUrl && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  asChild
                  title={t('common.viewOnOsm', undefined, 'View on OSM')}
                >
                  <a
                    href={osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t('common.viewOnOsm', undefined, 'View on OSM')}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label={t('common.closeTask', undefined, 'Close task')}
                title={t('common.closeTask', undefined, 'Close task')}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Task ID */}
          <div className="font-bold text-base text-zinc-900 leading-tight dark:text-zinc-100">
            {t('common.taskWithId', { id: selectedTask?.id ?? '' }, 'Task #{id}')}
          </div>

          {/* Challenge › Project breadcrumb */}
          {(challenge || project) && (
            <div className="text-xs text-zinc-500 leading-tight dark:text-zinc-400">
              {challenge && (
                <Link
                  to="/challenge/$challengeId"
                  params={{ challengeId: String(challenge.id) }}
                  className="text-zinc-600 underline-offset-2 transition-colors hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-100"
                >
                  {challenge.name}
                </Link>
              )}
              {challenge && project && (
                <span className="mx-1.5 text-zinc-400 dark:text-zinc-500">›</span>
              )}
              {project && (
                <Link
                  to="/project/$projectId"
                  params={{ projectId: String(project.id) }}
                  className="text-zinc-600 underline-offset-2 transition-colors hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-100"
                >
                  {project.displayName ?? project.name}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Action zone: Start Task primary CTA */}
        {task && (
          <div className="mt-3 flex items-center justify-end border-slate-200/60 border-t pt-3 dark:border-slate-700/40">
            <Button size="sm" onClick={handleStartTask} className="gap-1.5 rounded-full">
              <Play className="size-4" />
              {t('taskInfoPanel.drawer.startTask', undefined, 'Start Task')}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {isOpen && task && taskContextValue && (
        <TaskContext.Provider value={taskContextValue}>
          <TaskTabs
            task={task}
            taskTabContent={
              <div className="space-y-3">
                {/* Bundle Info */}
                {bundleData && bundleData.taskIds.length > 1 && (
                  <div>
                    <div className="flex items-center gap-2 pb-2">
                      <Package className="h-3.5 w-3.5 text-zinc-400" />
                      <span className="font-medium text-xs text-zinc-500 uppercase tracking-wide dark:text-slate-400">
                        {t(
                          'common.bundledTasks',
                          { count: bundleData.taskIds.length - 1 },
                          'Bundled Tasks ({count})'
                        )}
                      </span>
                    </div>
                    <div className="max-h-48 space-y-1 overflow-y-auto">
                      {bundleData.taskIds
                        .filter((id) => id !== task.id)
                        .map((taskId) => (
                          <button
                            key={taskId}
                            type="button"
                            onClick={() =>
                              navigate({
                                to: '/tasks/$taskId',
                                params: { taskId: taskId.toString() },
                              })
                            }
                            className="flex h-8 w-full items-center rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-left text-sm transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-700 dark:hover:bg-blue-950/30"
                          >
                            <span className="font-medium text-xs text-zinc-600 dark:text-slate-300">
                              {t('common.taskWithId', { id: taskId }, 'Task #{id}')}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Challenge Instructions */}
                {challenge?.instruction && task && (
                  <div>
                    <h3 className="mb-2 font-semibold text-xs text-zinc-500 uppercase tracking-wide dark:text-slate-400">
                      {t('common.instructions', undefined, 'Instructions')}
                    </h3>
                    <div className="text-sm text-zinc-700 leading-relaxed dark:text-slate-300 [&_:is(h1,h2,h3,h4,h5,h6)]:mt-4 [&_:is(h1,h2,h3,h4,h5,h6)]:mb-2 [&_:is(h1,h2,h3,h4,h5,h6)]:font-bold [&_:is(h1,h2,h3,h4,h5,h6)]:text-base [&_:is(h1,h2,h3,h4,h5,h6)]:text-zinc-900 [&_:is(h1,h2,h3,h4,h5,h6)]:leading-snug [&_:is(h1,h2,h3,h4,h5,h6)]:first:mt-0 [&_:is(h1,h2,h3,h4,h5,h6)]:dark:text-white [&_a]:text-blue-600 [&_a]:hover:underline [&_a]:dark:text-blue-400 [&_blockquote]:my-2 [&_blockquote]:border-zinc-300 [&_blockquote]:border-l-2 [&_blockquote]:pl-2 [&_blockquote]:italic [&_blockquote]:dark:border-slate-600 [&_code]:rounded [&_code]:bg-zinc-200 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:dark:bg-slate-800 [&_li]:my-0.5 [&_ol]:my-1 [&_ol]:ml-4 [&_ol]:list-decimal [&_p]:my-1 [&_p]:first:mt-0 [&_ul]:my-1 [&_ul]:ml-4 [&_ul]:list-disc">
                      <ReactMarkdown
                        remarkPlugins={markdownRemarkPlugins}
                        components={{
                          a: (props) => (
                            <a
                              {...props}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline dark:text-blue-400"
                            />
                          ),
                        }}
                      >
                        {substituteTaskProperties(challenge.instruction, task)}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            }
          />
        </TaskContext.Provider>
      )}
    </Drawer>
  )
}
