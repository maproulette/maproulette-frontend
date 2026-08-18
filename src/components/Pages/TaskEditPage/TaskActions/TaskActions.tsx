import type { VariantProps } from 'class-variance-authority'
import { CheckCircle2, Flag, LogIn, X } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import { useChallengeContext } from '@/components/Pages/TaskEditPage/contexts/ChallengeContext'
import {
  type KeyboardShortcut,
  useRegisterShortcuts,
} from '@/components/Pages/TaskEditPage/contexts/KeyboardShortcutsContext'
import {
  EDITABLE_STATUSES,
  useTaskContext,
} from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { ChallengePausedNotice } from '@/components/shared/ChallengePausedNotice'
import { Button, type buttonVariants } from '@/components/ui/Button'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { TaskActionModal } from '../TaskActionModal'
import { NavigationActions } from './NavigationActions'
import { StartMappingActions } from './StartMappingActions'

export const TaskActions = () => {
  const { t } = useIntl()
  const pausedMessage = t(
    'taskEditPage.taskActions.main.pausedMessage',
    undefined,
    'This challenge is currently paused. Tasks cannot be completed until it is resumed.'
  )
  const { task, isLocked } = useTaskContext()
  const { challenge } = useChallengeContext()
  const { isAuthenticated, login } = useAuthContext()
  const isPaused = challenge.paused
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [modalConfig, setModalConfig] = useState<{
    status: number
    label: string
  } | null>(null)

  const openModal = (status: number, label: string) => {
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
  }> = [
    {
      variant: 'success',
      icon: <CheckCircle2 />,
      onClick: handleMarkAsFixed,
      title: t(
        'taskEditPage.taskActions.main.markFixedTitle',
        undefined,
        'Mark as Fixed (Ctrl/Cmd + F)'
      ),
      label: t('common.fixed', undefined, 'Fixed'),
    },
    {
      variant: 'info',
      icon: <CheckCircle2 />,
      onClick: handleMarkAsAlreadyFixed,
      title: t(
        'taskEditPage.taskActions.main.markAlreadyFixedTitle',
        undefined,
        'Mark as Already Fixed'
      ),
      label: t('common.alreadyFixed', undefined, 'Already Fixed'),
    },
    {
      variant: 'warning',
      icon: <Flag />,
      onClick: handleMarkAsFalsePositive,
      title: t(
        'taskEditPage.taskActions.main.markFalsePositiveTitle',
        undefined,
        'Mark as False Positive (Ctrl/Cmd + P)'
      ),
      label: t('taskEditPage.taskActions.main.notAnIssue', undefined, 'Not an Issue'),
    },
    {
      variant: 'caution',
      icon: <X />,
      onClick: handleMarkAsTooHard,
      title: t(
        'taskEditPage.taskActions.main.markCantCompleteTitle',
        undefined,
        "Mark as Can't Complete"
      ),
      label: t('common.cantComplete', undefined, "Can't Complete"),
    },
  ]

  // Keyboard shortcuts - only when locked, and not while a modal is open or the challenge is paused
  const shortcutsEnabled = isLocked && !isModalOpen && !isPaused

  // Reason: stable shortcut definitions for keyboard handler registration
  const taskActionsShortcuts: KeyboardShortcut[] = useMemo(
    () => [
      {
        key: 'f',
        ctrlOrCmd: true,
        description: t(
          'taskEditPage.taskActions.main.markFixedTitle',
          undefined,
          'Mark as Fixed (Ctrl/Cmd + F)'
        ),
        category: t('taskEditPage.taskActions.main.shortcutsCategory', undefined, 'Task Actions'),
        handler: handleMarkAsFixed,
        enabled: shortcutsEnabled,
      },
      {
        key: 'p',
        ctrlOrCmd: true,
        description: t(
          'taskEditPage.taskActions.main.markFalsePositiveTitle',
          undefined,
          'Mark as False Positive (Ctrl/Cmd + P)'
        ),
        category: t('taskEditPage.taskActions.main.shortcutsCategory', undefined, 'Task Actions'),
        handler: handleMarkAsFalsePositive,
        enabled: shortcutsEnabled,
      },
    ],
    [shortcutsEnabled, t]
  )
  useRegisterShortcuts('task-actions', taskActionsShortcuts)

  // Show sign in button if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="rounded-lg bg-zinc-100 p-1.5 dark:bg-slate-800/60">
        <Button variant="success" size="lg" className="w-full" onClick={login}>
          <LogIn />
          {t('taskEditPage.taskActions.main.signInToMap', undefined, 'Sign in to map this task')}
        </Button>
      </div>
    )
  }

  // While a completion is being submitted, we hold the completion buttons in place (disabled)
  // until we navigate to the next task - so the now-completed status doesn't briefly swap in a
  // different button set (navigation / start-mapping). Skip the status/lock-driven branches.
  if (!isSubmitting) {
    // Show navigation buttons for non-editable statuses (Fixed, False Positive, Deleted, Already Fixed)
    if (!EDITABLE_STATUSES.includes(task.status ?? 0)) {
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

  // Show completion buttons when locked (disabled while a submission is in flight)
  return (
    <>
      <div className="rounded-lg bg-zinc-100 p-1.5 dark:bg-slate-800/60">
        <div className="mb-1.5 px-1 font-medium text-xs text-zinc-500 uppercase tracking-wider dark:text-slate-400">
          {t(
            'taskEditPage.taskActions.main.completionHeading',
            undefined,
            'Completion: Set Task Status'
          )}
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {completionActions.map((action) => (
            <Button
              key={action.label}
              variant={action.variant}
              size="sm"
              onClick={action.onClick}
              title={action.title}
              className="w-full"
              disabled={isSubmitting}
            >
              {action.icon}
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      {modalConfig && (
        <TaskActionModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          task={task}
          initialStatus={modalConfig.status}
          onSubmittingChange={setIsSubmitting}
        />
      )}
    </>
  )
}
