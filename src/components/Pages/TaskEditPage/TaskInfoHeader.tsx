import { Link } from '@tanstack/react-router'
import {
  BookOpen,
  FolderOpen,
  Layers,
  MoreHorizontal,
  MousePointerClick,
  Pencil,
  Share2,
  Star,
  X,
} from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import { useChallengeContext } from '@/components/Pages/TaskEditPage/contexts/ChallengeContext'
import {
  EDITABLE_STATUSES,
  useTaskContext,
} from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { SharePopoverContent } from '@/components/shared/ShareLink/SharePopoverContent'
import { BundleActions } from '@/components/TaskInfoPanel/BundleActions'
import { Button } from '@/components/ui/Button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useAuthContext } from '@/contexts/AuthContext'
import { usePluginContext } from '@/contexts/PluginContext'
import { useIntl } from '@/i18n'
import { canManageChallenge } from '@/lib/challengePermissions'
import { getStatusLabel, STATUS_COLORS } from '@/lib/taskConstants'
import { cn } from '@/lib/utils'
import type { Task } from '@/types/Task'
import {
  challengeDescriptionText,
  projectDescriptionText,
} from './contexts/descriptionRecommendation'
import { usePanelViewContext } from './contexts/PanelViewContext'
import { DescriptionBreadcrumbButton } from './DescriptionBreadcrumbButton'
import { EditorButton } from './TaskActions/EditorButton'
import { LockButton } from './TaskActions/LockButton'
import { SkipButton } from './TaskActions/SkipButton'
import { useDescriptionRecommendation } from './useDescriptionRecommendation'

export type TaskRelation = 'primary' | 'bundle' | 'selection'

const RELATION_PILLS: Record<TaskRelation, { className: string; icon: typeof Star }> = {
  primary: {
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: Star,
  },
  bundle: {
    className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    icon: Layers,
  },
  selection: {
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    icon: MousePointerClick,
  },
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
  const { isAuthenticated, user } = useAuthContext()
  const { isTaskEditableByPlugins } = usePluginContext()
  const { data: project } = api.project.getProject(challenge?.parent)
  const { task: contextTask } = useTaskContext()
  const { showView } = usePanelViewContext()
  const { recommended, markDescriptionRead } = useDescriptionRecommendation()
  const [shareOpen, setShareOpen] = useState(false)

  const challengeDescription = challengeDescriptionText(challenge)
  const projectDescription = projectDescriptionText(project)

  const status = task.status ?? 0
  const statusLabel =
    getStatusLabel(t, status) || t({ id: 'common.unknown', defaultMessage: 'Unknown' })
  const statusColor = STATUS_COLORS[status] || 'bg-zinc-500'

  const isEditable = EDITABLE_STATUSES.includes(status) || isTaskEditableByPlugins(task)
  // Only show edit actions if user is authenticated, has locked the task, and status is editable
  // (including plugin-unlocked revision flows)
  const canEdit = isAuthenticated && isLocked && isEditable
  const canSkip = EDITABLE_STATUSES.includes(status)
  // Editing the task's own record (name, instructions, geometry) is a challenge
  // manager's job, and is reached from the overflow menu rather than a page of
  // its own.
  const canManageTask = canManageChallenge(user, challenge)

  const showActionRow = showActions && canEdit

  const RelationIcon = RELATION_PILLS[relation].icon
  const relationLabel = {
    primary: t({ id: 'common.primary', defaultMessage: 'Primary' }),
    bundle: t({ id: 'taskEditPage.taskInfoHeader.bundled', defaultMessage: 'Bundled' }),
    selection: t({ id: 'taskEditPage.taskInfoHeader.selected', defaultMessage: 'Selected' }),
  }[relation]

  return (
    <div className="shrink-0 rounded-t-lg border-slate-200 border-b bg-white px-4 py-3 dark:border-slate-700/50 dark:bg-slate-800">
      {/* Info zone: badges row, title, breadcrumb */}
      <div className="space-y-1.5">
        {/* Status + Primary badge (left) | icon utilities + ellipsis (right) */}
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex flex-wrap gap-x-2 gap-y-1">
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-white text-xs',
                statusColor
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
              {statusLabel}
            </div>
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-0.5 font-medium text-xs',
                RELATION_PILLS[relation].className
              )}
            >
              <RelationIcon className={cn('h-3 w-3', relation === 'primary' && 'fill-current')} />
              {relationLabel}
            </span>
          </div>

          <div className="flex gap-1">
            {task.id === contextTask.id && isEditable && <LockButton compact />}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={t({ id: 'common.openMenu', defaultMessage: 'Open menu' })}
                  title={t({ id: 'common.openMenu', defaultMessage: 'Open menu' })}
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="flex cursor-pointer items-center gap-2"
                  onSelect={() => setShareOpen(true)}
                >
                  <Share2 className="size-4" />
                  {t({ id: 'common.shareTask', defaultMessage: 'Share task' })}
                </DropdownMenuItem>
                {canManageTask && (
                  <DropdownMenuItem asChild>
                    <Link
                      to="/manage/task/$taskId/edit"
                      params={{ taskId: String(task.id) }}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <Pencil className="size-4" />
                      {t({ id: 'common.editTask', defaultMessage: 'Edit task' })}
                    </Link>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            {onClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label={t({ id: 'common.closeTask', defaultMessage: 'Close task' })}
                title={t({ id: 'common.closeTask', defaultMessage: 'Close task' })}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Project › Challenge breadcrumb, each with a button opening its description */}
        {(challenge || project) && (
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 leading-tight dark:text-zinc-400">
            {project && (
              <>
                <DescriptionBreadcrumbButton
                  icon={FolderOpen}
                  label={t({
                    id: 'taskEditPage.taskInfoHeader.viewProjectDescription',
                    defaultMessage: 'View project description',
                  })}
                  disabled={!projectDescription}
                  disabledReason={t({
                    id: 'taskEditPage.taskInfoHeader.noProjectDescription',
                    defaultMessage: 'This project has no description',
                  })}
                  onClick={() => showView('projectDescription')}
                />
                <Link
                  to="/project/$projectId"
                  params={{ projectId: String(project.id) }}
                  className="text-zinc-600 underline-offset-2 transition-colors hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-100"
                >
                  {project.displayName ?? project.name}
                </Link>
              </>
            )}
            {challenge && project && <span className="text-zinc-400 dark:text-zinc-500">›</span>}
            {challenge && (
              <>
                <DescriptionBreadcrumbButton
                  icon={BookOpen}
                  label={t({
                    id: 'taskEditPage.taskInfoHeader.viewChallengeDescription',
                    defaultMessage: 'View challenge description',
                  })}
                  recommendationLabel={t({
                    id: 'taskEditPage.taskInfoHeader.readChallengeDescription',
                    defaultMessage:
                      'Make sure that you have read the challenge description as it could have important information not mentioned in the task instructions',
                  })}
                  recommended={relation === 'primary' && recommended}
                  disabled={!challengeDescription}
                  disabledReason={t({
                    id: 'taskEditPage.taskInfoHeader.noChallengeDescription',
                    defaultMessage: 'This challenge has no description',
                  })}
                  onClick={() => {
                    markDescriptionRead()
                    showView('challengeDescription')
                  }}
                />
                <Link
                  to="/challenge/$challengeId"
                  params={{ challengeId: String(challenge.id) }}
                  className="text-zinc-600 underline-offset-2 transition-colors hover:text-zinc-900 hover:underline dark:text-zinc-300 dark:hover:text-zinc-100"
                >
                  {challenge.name}
                </Link>
              </>
            )}
          </div>
        )}

        {/* Task ID */}
        <div className="font-bold text-base text-zinc-900 leading-tight dark:text-zinc-100">
          {t({ id: 'common.taskWithId', defaultMessage: 'Task #{id}' }, { id: task.id })}
        </div>
      </div>

      {/* The share panel the overflow menu opens: copy link, QR code, native share. */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent size="sm" className="p-0">
          <DialogHeader className="sr-only">
            <DialogTitle>{t({ id: 'common.shareTask', defaultMessage: 'Share task' })}</DialogTitle>
          </DialogHeader>
          <SharePopoverContent
            url={`${window.location.origin}/tasks/${task.id}`}
            title={
              task.name
                ? t(
                    { id: 'common.taskWithName', defaultMessage: 'Task: {name}' },
                    { name: task.name }
                  )
                : t({ id: 'common.taskWithId', defaultMessage: 'Task #{id}' }, { id: task.id })
            }
            description={challenge?.name}
          />
        </DialogContent>
      </Dialog>

      {/* Action zone: Skip + Editor (only when user can edit) */}
      {showActionRow && (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3">
          {canSkip ? <SkipButton task={task} /> : <div />}
          <EditorButton task={task} />
        </div>
      )}

      {/* Joining or leaving the bundle, for a task that isn't the primary one.
        The wrapper collapses when there is no action to offer. */}
      <div className="pt-3 empty:hidden">
        <BundleActions task={task} />
      </div>
    </div>
  )
}
