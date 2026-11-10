import type { VariantProps } from 'class-variance-authority'
import { CheckCircle2, Flag, LogIn, X } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { useChallengeContext } from '@/components/Pages/TaskEditPage/contexts/ChallengeContext'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { ChallengePausedNotice } from '@/components/shared/ChallengePausedNotice'
import { Button, type buttonVariants } from '@/components/ui/Button'
import { useAuthContext } from '@/contexts/AuthContext'
import { type KeyboardShortcut, useRegisterShortcuts } from '@/contexts/KeyboardShortcutsContext'
import { useIsDesktopLayoutContext } from '@/contexts/LayoutContext'
import { useIntl } from '@/i18n'
import { type ShortcutBinding, withBindingHint } from '@/lib/keyboardShortcuts'
import { allowedStatusProgressions, TASK_STATUS } from '@/lib/taskStatusProgressions'
import { TaskActionModal } from '../TaskActionModal'
import { useMappingAvailability } from '../useTaskShortcuts'
import { NavigationActions } from './NavigationActions'
import { StartMappingActions } from './StartMappingActions'
import { useConfirmDiscardIdEdits } from './useConfirmDiscardIdEdits'

/**
 * The status keys carried over from MapRoulette 3, kept on the left-hand
 * cluster a mapper can reach without leaving the mouse. Each opens the
 * confirmation dialog rather than submitting outright, which is what makes a
 * bare letter safe here.
 */
const STATUS_BINDINGS: Record<number, ShortcutBinding> = {
  [TASK_STATUS.fixed]: { key: 'f' },
  [TASK_STATUS.falsePositive]: { key: 'q' },
  [TASK_STATUS.alreadyFixed]: { key: 'x' },
  [TASK_STATUS.tooHard]: { key: 'd' },
}

export const TaskActions = () => {
  const { t } = useIntl()
  const pausedMessage = t({
    id: 'taskEditPage.taskActions.main.pausedMessage',
    defaultMessage:
      'This challenge is currently paused. Tasks cannot be completed until it is resumed.',
  })
  const { task, isLocked, isEditable } = useTaskContext()
  const { challenge } = useChallengeContext()
  const { isAuthenticated, login } = useAuthContext()
  const isPaused = challenge.paused
  const isDesktop = useIsDesktopLayoutContext()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalConfig, setModalConfig] = useState<{
    status: number
    label: string
  } | null>(null)

  const confirmDiscardIdEdits = useConfirmDiscardIdEdits()

  const openModal = (status: number, label: string) => {
    if (!confirmDiscardIdEdits()) return
    setModalConfig({ status, label })
    setIsModalOpen(true)
  }

  const handleMarkAsFixed = () => {
    openModal(1, 'Fixed')
  }

  const handleMarkAsFalsePositive = () => {
    openModal(2, 'False Positive')
  }

  const handleMarkAsTooHard = () => {
    openModal(6, "Can't Complete")
  }

  const handleMarkAsAlreadyFixed = () => {
    openModal(5, 'Already Fixed')
  }

  const completionActions: Array<{
    variant: VariantProps<typeof buttonVariants>['variant']
    icon: ReactNode
    onClick: () => void
    title: string
    label: string
    status: number
  }> = [
    {
      status: TASK_STATUS.fixed,
      variant: 'success',
      icon: <CheckCircle2 />,
      onClick: handleMarkAsFixed,
      title: t({
        id: 'taskEditPage.taskActions.main.markFixedTitle',
        defaultMessage: 'Mark as Fixed',
      }),
      label: t({ id: 'common.fixed', defaultMessage: 'Fixed' }),
    },
    {
      status: TASK_STATUS.alreadyFixed,
      variant: 'info',
      icon: <CheckCircle2 />,
      onClick: handleMarkAsAlreadyFixed,
      title: t({
        id: 'taskEditPage.taskActions.main.markAlreadyFixedTitle',
        defaultMessage: 'Mark as Already Fixed',
      }),
      label: t({ id: 'common.alreadyFixed', defaultMessage: 'Already Fixed' }),
    },
    {
      status: TASK_STATUS.falsePositive,
      variant: 'warning',
      icon: <Flag />,
      onClick: handleMarkAsFalsePositive,
      title: t({
        id: 'taskEditPage.taskActions.main.markNotAnIssueTitle',
        defaultMessage: 'Mark as Not an Issue',
      }),
      label: t({ id: 'common.notAnIssue', defaultMessage: 'Not an Issue' }),
    },
    {
      status: TASK_STATUS.tooHard,
      variant: 'caution',
      icon: <X />,
      onClick: handleMarkAsTooHard,
      title: t({
        id: 'taskEditPage.taskActions.main.markCantCompleteTitle',
        defaultMessage: "Mark as Can't Complete",
      }),
      label: t({ id: 'common.cantComplete', defaultMessage: "Can't Complete" }),
    },
  ]

  // maproulette3 only offers the statuses a task is allowed to progress to, so
  // a task that has already been resolved isn't offered a contradictory one.
  // Memoized because the shortcut registration below depends on it, and a new
  // Set every render would re-register on every render.
  const allowedProgressions = useMemo(
    () => allowedStatusProgressions(task.status ?? TASK_STATUS.created),
    [task.status]
  )
  const availableCompletionActions = completionActions.filter((action) =>
    allowedProgressions.has(action.status)
  )

  // A status key is live only while the mapper actually holds the task. The
  // dialog that a status opens suspends shortcuts on its own, so there is
  // nothing to gate on here.
  const { canEdit, disabledReason } = useMappingAvailability()

  // Reason: stable shortcut definitions for keyboard handler registration.
  // completionActions is not a dependency: it is rebuilt every render, and its
  // handlers only close over stable setState functions and
  // confirmDiscardIdEdits, which only changes with `t`, so re-running on `t`
  // (which is what changes its labels) is enough.
  const taskActionsShortcuts: KeyboardShortcut[] = useMemo(
    () =>
      completionActions
        .filter((action) => STATUS_BINDINGS[action.status])
        .map((action) => ({
          ...STATUS_BINDINGS[action.status],
          description: action.title,
          category: 'taskActions' as const,
          handler: action.onClick,
          // Offered only when the task can actually progress to that status.
          enabled: canEdit && allowedProgressions.has(action.status),
          disabledReason: canEdit
            ? t({
                id: 'keyboardShortcuts.unavailable.statusNotAllowed',
                defaultMessage: 'Not available for this task',
              })
            : disabledReason,
        })),
    [canEdit, disabledReason, allowedProgressions, t]
  )
  useRegisterShortcuts('task-actions', taskActionsShortcuts)

  // Show sign in button if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="rounded-lg bg-zinc-100 p-1.5 dark:bg-slate-800/60">
        <Button variant="success" size="lg" className="w-full" onClick={login}>
          <LogIn />
          {t({
            id: 'common.signInToMapTask',
            defaultMessage: 'Sign in to map this task',
          })}
        </Button>
      </div>
    )
  }

  // While a completion is being submitted, we hold the completion buttons in place (disabled)
  // until we navigate to the next task - so the now-completed status doesn't briefly swap in a
  // different button set (navigation / start-mapping). Skip the status/lock-driven branches.
  if (!isSubmitting) {
    // Show navigation buttons for non-editable statuses (unless a plugin unlocks editing)
    if (!isEditable) {
      return <NavigationActions challengeId={task.parent} taskId={task.id} />
    }

    // Replace all task actions with a notice while the challenge is paused
    if (isPaused) {
      return <ChallengePausedNotice message={pausedMessage} />
    }

    // Show start mapping button if not locked
    if (!isLocked) {
      return <StartMappingActions challengeId={task.parent} />
    }
  }

  const modal = modalConfig && (
    <TaskActionModal
      open={isModalOpen}
      onOpenChange={setIsModalOpen}
      task={task}
      initialStatus={modalConfig.status}
      onSubmittingChange={setIsSubmitting}
    />
  )

  if (!isDesktop) {
    const defaultAction = availableCompletionActions[0]
    return (
      <>
        <Button
          variant="success"
          size="lg"
          className="w-full"
          onClick={defaultAction?.onClick}
          disabled={isSubmitting || !defaultAction}
        >
          <CheckCircle2 />
          {t({ id: 'taskEditPage.taskActions.main.submitTask', defaultMessage: 'Submit Task' })}
        </Button>
        {modal}
      </>
    )
  }

  // Show completion buttons when locked (disabled while a submission is in flight)
  return (
    <>
      <div className="@container rounded-lg bg-zinc-100 p-1.5 dark:bg-slate-800/60">
        <div className="mb-1.5 px-1 font-medium text-xs text-zinc-500 uppercase tracking-wider dark:text-slate-400">
          {t({
            id: 'taskEditPage.taskActions.main.completionHeading',
            defaultMessage: 'Completion: Set Task Status',
          })}
        </div>
        <div className="grid @xs:grid-cols-2 grid-cols-1 gap-1.5">
          {availableCompletionActions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              title={
                STATUS_BINDINGS[action.status]
                  ? withBindingHint(action.title, STATUS_BINDINGS[action.status])
                  : action.title
              }
              className="w-full"
              disabled={isSubmitting}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {modal}
    </>
  )
}
