import { Link } from '@tanstack/react-router'
import bbox from '@turf/bbox'
import { ExternalLink, Eye, EyeOff, Share2, Star, X, ZoomIn } from 'lucide-react'
import { api } from '@/api'
import { useChallengeContext } from '@/components/Pages/TaskEditPage/contexts/ChallengeContext'
import {
  EDITABLE_STATUSES,
  useTaskContext,
} from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useTaskMapContext } from '@/components/Pages/TaskEditPage/contexts/TaskMapContext'
import { SharePopoverContent } from '@/components/shared/ShareLink/SharePopoverContent'
import {
  getOsmServerUrl,
  parseOsmFeatureFromTask,
} from '@/components/TaskInfoPanel/taskUtils/osmUtils'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { getStatusLabel, STATUS_COLORS } from '@/lib/taskConstants'
import { cn } from '@/lib/utils'
import type { Bbox2D } from '@/types/Map'
import type { Task } from '@/types/Task'
import { EditorButton } from './TaskActions/EditorButton'
import { LockButton } from './TaskActions/LockButton'
import { SkipButton } from './TaskActions/SkipButton'

export type TaskRelation = 'primary' | 'bundle' | 'selection'

export const HEADER_GRADIENTS: Record<TaskRelation, string> = {
  primary:
    'bg-gradient-to-r from-amber-200 via-amber-100/50 to-white dark:from-amber-800/50 dark:via-amber-900/25 dark:to-slate-800',
  bundle:
    'bg-gradient-to-r from-green-200 via-green-100/50 to-white dark:from-green-800/50 dark:via-green-900/25 dark:to-slate-800',
  selection:
    'bg-gradient-to-r from-purple-200 via-purple-100/50 to-white dark:from-purple-800/50 dark:via-purple-900/25 dark:to-slate-800',
}

export const TaskInfoHeader = ({
  task,
  relation,
  showActions = true,
  isLocked = false,
  onClose,
}: {
  task: Task
  relation: TaskRelation
  showActions?: boolean
  isLocked?: boolean
  onClose?: () => void
}) => {
  const { t } = useIntl()
  const { challenge } = useChallengeContext()
  const { isAuthenticated } = useAuthContext()
  const { map, markersHidden, setMarkersHidden } = useTaskMapContext()
  const { data: project } = api.project.getProject(challenge?.parent)
  const { task: contextTask } = useTaskContext()

  const status = task.status ?? 0
  const statusLabel = getStatusLabel(t, status) || t('common.unknown', undefined, 'Unknown')
  const statusColor = STATUS_COLORS[status] || 'bg-zinc-500'

  // Only show edit actions if user is authenticated, has locked the task, and status is editable
  const canEdit = isAuthenticated && isLocked && EDITABLE_STATUSES.includes(status)

  const osmFeature = parseOsmFeatureFromTask(task)
  const osmServer = getOsmServerUrl()
  const osmUrl =
    task.name && osmFeature
      ? `${osmServer}/${osmFeature.type}/${osmFeature.id}`
      : task.name && /^(node|way|relation)\/\d+$/.test(String(task.name))
        ? `${osmServer}/${task.name}`
        : task.name && /^\d+$/.test(String(task.name))
          ? `${osmServer}/way/${task.name}`
          : null

  const handleZoomToTask = () => {
    if (!map?.current) return
    map.current.fitBounds(bbox(task.geometries) as Bbox2D, {
      padding: 50,
      duration: 0,
      maxZoom: 18,
    })
  }

  const showActionRow = showActions && canEdit

  return (
    <div
      className={cn(
        'shrink-0 rounded-t-xl border-slate-200 border-b bg-white px-4 py-3 dark:border-slate-700/50 dark:bg-slate-800',
        HEADER_GRADIENTS[relation]
      )}
    >
      {/* Info zone: badges row, title, breadcrumb */}
      <div className="space-y-1.5">
        {/* Status + Primary badge (left) | icon utilities + ellipsis (right) */}
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
          {relation === 'primary' && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700 text-xs dark:bg-amber-900/30 dark:text-amber-400">
              <Star className="h-3 w-3 fill-current" />
              {t('common.primary', undefined, 'Primary')}
            </span>
          )}
          <div className="ml-auto flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(markersHidden && 'text-amber-600 dark:text-amber-400')}
              onClick={() => setMarkersHidden(!markersHidden)}
              aria-label={
                markersHidden
                  ? t('taskEditPage.taskInfoHeader.showMarkers', undefined, 'Show task markers')
                  : t('taskEditPage.taskInfoHeader.hideMarkers', undefined, 'Hide task markers')
              }
              title={
                markersHidden
                  ? t('taskEditPage.taskInfoHeader.showMarkers', undefined, 'Show task markers')
                  : t('taskEditPage.taskInfoHeader.hideMarkers', undefined, 'Hide task markers')
              }
            >
              {markersHidden ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleZoomToTask}
              aria-label={t('common.zoomToTask', undefined, 'Zoom to task')}
              title={t('common.zoomToTask', undefined, 'Zoom to task')}
            >
              <ZoomIn className="size-4" />
            </Button>
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
            {task.id === contextTask.id && EDITABLE_STATUSES.includes(status) && (
              <LockButton compact />
            )}
            {onClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label={t('common.closeTask', undefined, 'Close task')}
                title={t('common.closeTask', undefined, 'Close task')}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Task ID */}
        <div className="font-bold text-base text-zinc-900 leading-tight dark:text-zinc-100">
          {t('common.taskWithId', { id: task.id }, 'Task #{id}')}
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

      {/* Action zone: Skip + Editor (only when user can edit) */}
      {showActionRow && (
        <div className="mt-3 flex items-center justify-between gap-2 border-slate-200/60 border-t pt-3 dark:border-slate-700/40">
          <SkipButton task={task} />
          <EditorButton task={task} />
        </div>
      )}
    </div>
  )
}
