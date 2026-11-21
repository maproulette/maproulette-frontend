import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { ExternalLink, Package, Play, Share2, X, ZoomIn } from 'lucide-react'
import type { MapRef } from 'react-map-gl/maplibre'
import { challengeOptions } from '@/api/challenge'
import { projectOptions } from '@/api/project'
import { taskOptions } from '@/api/task'
import { taskBundleOptions } from '@/api/taskBundle'
import { MarkdownContent } from '@/components/shared/MarkdownContent'
import { SharePopoverContent } from '@/components/shared/ShareLink/SharePopoverContent'
import {
  getOsmServerUrl,
  parseOsmFeatureFromTask,
} from '@/components/TaskInfoPanel/taskUtils/osmUtils'
import { substituteMarkdownTaskProperties } from '@/components/TaskInfoPanel/taskUtils/propertyUtils'
import { Button } from '@/components/ui/Button'
import { Drawer } from '@/components/ui/Drawer'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { useDrawerTransition } from '@/hooks/useDrawerTransition'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'
import { useIntl } from '@/i18n'
import { getStatusLabel, STATUS_BAR_COLORS, STATUS_PILL_COLORS } from '@/lib/taskConstants'
import { cn } from '@/lib/utils'
import type { Task, TaskMarker } from '@/types/Task'
import { TaskTabs } from './TaskTabs'

interface TaskInfoDrawerProps {
  selectedTask: TaskMarker | null
  onClose: () => void
  mapRef: React.RefObject<MapRef | null>
}

export const TaskInfoDrawer = ({ selectedTask, onClose, mapRef }: TaskInfoDrawerProps) => {
  const { t } = useIntl()
  const navigateToTask = useNavigateToTask()

  const { data: fullTask } = useQuery(taskOptions(selectedTask?.id ?? 0))
  const task = fullTask as Task | undefined

  const { data: challenge } = useQuery(challengeOptions(task?.parent ?? 0))
  const { data: project } = useQuery(projectOptions(challenge?.parent))
  const { data: bundleData } = useQuery(taskBundleOptions(task?.bundleId ?? 0))

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
  const statusLabel =
    getStatusLabel(t, status) || t({ id: 'common.unknown', defaultMessage: 'Unknown' })

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

  return (
    <Drawer
      open={isOpen}
      onClose={onClose}
      aria-label={t(
        { id: 'common.taskWithId', defaultMessage: 'Task #{id}' },
        { id: selectedTask?.id ?? '' }
      )}
    >
      {/* Header */}
      <div className="shrink-0 rounded-t-lg border-line border-b bg-inset px-4 py-3">
        {/* Info zone: badges row, title, breadcrumb */}
        <div className="space-y-1.5">
          {/* Status badge (left) | icon utilities (right) */}
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-2 py-0.5 font-medium text-xs',
                STATUS_PILL_COLORS[status]
              )}
            >
              <span className={cn('size-1.5 rounded-full', STATUS_BAR_COLORS[status])} />
              {statusLabel}
            </div>
            <div className="ml-auto flex items-center gap-1">
              {selectedTask?.location && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleZoomToTask}
                  aria-label={t({ id: 'common.zoomToTask', defaultMessage: 'Zoom to task' })}
                  title={t({ id: 'common.zoomToTask', defaultMessage: 'Zoom to task' })}
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
                      aria-label={t({ id: 'common.shareTask', defaultMessage: 'Share task' })}
                      title={t({ id: 'common.shareTask', defaultMessage: 'Share task' })}
                    >
                      <Share2 className="size-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80">
                    <SharePopoverContent
                      url={`${window.location.origin}/tasks/${task.id}`}
                      title={
                        task.name
                          ? t(
                              { id: 'common.taskWithName', defaultMessage: 'Task: {name}' },
                              { name: task.name }
                            )
                          : t(
                              { id: 'common.taskWithId', defaultMessage: 'Task #{id}' },
                              { id: task.id }
                            )
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
                  title={t({ id: 'common.viewOnOsm', defaultMessage: 'View on OSM' })}
                >
                  <a
                    href={osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t({ id: 'common.viewOnOsm', defaultMessage: 'View on OSM' })}
                  >
                    <ExternalLink className="size-4" />
                  </a>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label={t({ id: 'common.closeTask', defaultMessage: 'Close task' })}
                title={t({ id: 'common.closeTask', defaultMessage: 'Close task' })}
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Task ID */}
          <div className="font-bold text-base text-fg leading-tight">
            {t(
              { id: 'common.taskWithId', defaultMessage: 'Task #{id}' },
              { id: selectedTask?.id ?? '' }
            )}
          </div>

          {/* Challenge › Project breadcrumb */}
          {(challenge || project) && (
            <div className="text-fg-muted text-xs leading-tight">
              {challenge && (
                <Link
                  to="/challenge/$challengeId"
                  params={{ challengeId: String(challenge.id) }}
                  className="text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
                >
                  {challenge.name}
                </Link>
              )}
              {challenge && project && <span className="mx-1.5 text-fg-subtle">›</span>}
              {project && (
                <Link
                  to="/project/$projectId"
                  params={{ projectId: String(project.id) }}
                  className="text-fg-muted underline-offset-2 transition-colors hover:text-fg hover:underline"
                >
                  {project.displayName ?? project.name}
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Action zone: Start Task primary CTA */}
        {task && (
          <div className="mt-3 flex items-center justify-end border-line border-t pt-3">
            <Button size="sm" onClick={handleStartTask} className="gap-1.5 rounded-full">
              <Play className="size-4" />
              {t({ id: 'taskInfoPanel.drawer.startTask', defaultMessage: 'Start Task' })}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      {isOpen && task && (
        <TaskTabs
          task={task}
          taskTabContent={
            <div className="space-y-3">
              {/* Bundle Info */}
              {bundleData && bundleData.taskIds.length > 1 && (
                <div>
                  <div className="flex items-center gap-2 pb-2">
                    <Package className="h-3.5 w-3.5 text-fg-subtle" />
                    <span className="font-medium text-fg-muted text-xs uppercase tracking-wide">
                      {t(
                        { id: 'common.bundledTasks', defaultMessage: 'Bundled Tasks ({count})' },
                        { count: bundleData.taskIds.length - 1 }
                      )}
                    </span>
                  </div>
                  <div className="max-h-48 space-y-1 overflow-y-auto">
                    {bundleData.taskIds
                      .filter((id) => id !== task.id)
                      .map((taskId) => (
                        <Link
                          key={taskId}
                          to="/tasks/$taskId"
                          params={{ taskId: taskId.toString() }}
                          className="flex h-8 w-full items-center rounded-lg border border-line bg-inset px-3 text-left text-sm transition-colors hover:border-accent hover:bg-accent/10"
                        >
                          <span className="font-medium text-fg-muted text-xs">
                            {t(
                              { id: 'common.taskWithId', defaultMessage: 'Task #{id}' },
                              { id: taskId }
                            )}
                          </span>
                        </Link>
                      ))}
                  </div>
                </div>
              )}

              {/* Challenge Instructions */}
              {(task?.instruction || challenge?.instruction) && task && (
                <div>
                  <h3 className="mb-2 font-semibold text-fg-muted text-xs uppercase tracking-wide">
                    {t({ id: 'common.instructions', defaultMessage: 'Instructions' })}
                  </h3>
                  <MarkdownContent autoLink={false}>
                    {substituteMarkdownTaskProperties(
                      task.instruction || challenge?.instruction || '',
                      task
                    )}
                  </MarkdownContent>
                </div>
              )}
            </div>
          }
        />
      )}
    </Drawer>
  )
}
