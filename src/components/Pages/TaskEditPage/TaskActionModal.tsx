import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, MapPin, Shuffle } from 'lucide-react'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCompletionResponses } from '@/contexts/CompletionResponsesContext'
import { type KeyboardShortcut, useRegisterShortcuts } from '@/contexts/KeyboardShortcutsContext'
import { usePluginContext } from '@/contexts/PluginContext'
import { useLockConflict } from '@/hooks/useLockConflict'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'
import { useIntl } from '@/i18n'
import { getApiErrorMessage } from '@/lib/apiError'
import type { ShortcutBinding } from '@/lib/keyboardShortcuts'
import { logger } from '@/lib/logger'
import { getStatusLabel } from '@/lib/taskConstants'
import { getAppSetting, withAppSetting } from '@/lib/userProperties'
import type { Task } from '@/types/Task'
import type { UserProperties } from '@/types/User'
import { PENDING_BUNDLE_ID, useTaskBundleContext } from './contexts/TaskBundleContext'
import { LockConflictModal } from './TaskActions/LockConflictModal'
import { TaskNearbyMap } from './TaskNearbyMap'

/**
 * Submitting the confirmation without reaching for the mouse. Shift+Enter is
 * MapRoulette 3's key; Ctrl/Cmd+Enter comes along because that is what the
 * comment boxes elsewhere in the app already use.
 */
const SUBMIT_BINDINGS: ShortcutBinding[] = [
  { key: 'Enter', shift: true },
  { key: 'Enter', ctrlOrCmd: true },
]

const LOAD_METHOD_APP_ID = 'mr3Frontend'
const LOAD_METHOD_KEY = 'loadMethod'

type NextTaskType = 'nearby' | 'random'

const readNextTaskType = (properties: UserProperties | null | undefined): NextTaskType =>
  getAppSetting(properties, LOAD_METHOD_APP_ID, LOAD_METHOD_KEY) === 'proximity'
    ? 'nearby'
    : 'random'

interface TaskActionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: Task
  initialStatus: number
  /**
   * Notified whenever a submission starts/finishes so the parent can keep the completion
   * buttons visible-but-disabled until we navigate to the next task, instead of letting the
   * now-completed status swap in a different button set.
   */
  onSubmittingChange?: (submitting: boolean) => void
}

export const TaskActionModal = ({
  open,
  onOpenChange,
  task,
  initialStatus,
  onSubmittingChange,
}: TaskActionModalProps) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const { taskActionExtensions: extensions } = usePluginContext()
  const navigateToTask = useNavigateToTask()
  const commentId = useId()
  const commentRef = useRef<HTMLTextAreaElement>(null)
  const tagsId = useId()
  const randomId = useId()
  const nearbyId = useId()
  const { user } = useAuthContext()
  const STATUS_OPTIONS = [
    { value: 1, label: t('common.fixed', undefined, 'Fixed') },
    {
      value: 2,
      label: t('common.falsePositive', undefined, 'False Positive'),
    },
    { value: 3, label: t('common.skipped', undefined, 'Skipped') },
    {
      value: 5,
      label: t('common.alreadyFixed', undefined, 'Already Fixed'),
    },
    {
      value: 6,
      label: t('common.cantComplete', undefined, "Can't Complete"),
    },
  ]
  const [newStatus, setNewStatus] = useState(initialStatus)
  const [comment, setComment] = useState('')
  const [tags, setTags] = useState('')
  const [nextTaskType, setNextTaskType] = useState<'nearby' | 'random'>(() =>
    readNextTaskType(user?.properties)
  )
  const [selectedNearbyTaskId, setSelectedNearbyTaskId] = useState<number | null>(null)
  const [formState, setFormState] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const addTaskCommentMutation = api.task.useAddTaskComment()
  const updateTaskStatusMutation = api.task.useUpdateTaskStatus()
  const updateCompletionResponsesMutation = api.task.useUpdateCompletionResponses()
  const completionResponses = useCompletionResponses()
  const updateBundleStatusMutation = api.taskBundle.useUpdateTaskBundleStatus()
  const createBundleMutation = api.taskBundle.useCreateTaskBundle()
  const updateBundleMutation = api.taskBundle.useUpdateTaskBundle()
  const updateUserSettingsMutation = api.user.useUpdateUserSettings()
  const lockConflict = useLockConflict()
  const { activeBundle, initialBundle } = useTaskBundleContext()
  const [currentStatus, setCurrentStatus] = useState(task.status ?? 0)
  const [animationDone, setAnimationDone] = useState(false)

  useEffect(() => {
    setNewStatus(initialStatus)
  }, [initialStatus])

  useEffect(() => {
    if (open) {
      setCurrentStatus(task.status ?? 0)
      setNextTaskType(readNextTaskType(user?.properties))
    }

    if (!open) {
      setAnimationDone(false)
      return
    }
    const timeout = window.setTimeout(() => setAnimationDone(true), 300)
    return () => window.clearTimeout(timeout)
  }, [open])

  // Keep the parent in sync so it can hold the completion buttons (disabled) in place
  // through the submit-and-navigate transition.
  useEffect(() => {
    onSubmittingChange?.(isSubmitting)
  }, [isSubmitting, onSubmittingChange])

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      const tagList = tags
        ? tags
            .trim()
            .split(',')
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined

      let resolvedBundleId: number | null = null

      if (activeBundle && activeBundle.taskIds.length > 1) {
        if (activeBundle.bundleId === PENDING_BUNDLE_ID) {
          const created = await createBundleMutation.mutateAsync({
            name: activeBundle.name,
            taskIds: activeBundle.taskIds,
            primaryId: task.id,
          })
          resolvedBundleId = created.bundleId
        } else {
          const initialIds = initialBundle?.taskIds ?? []
          const sameTasks =
            initialIds.length === activeBundle.taskIds.length &&
            initialIds.every((id) => activeBundle.taskIds.includes(id))
          if (!sameTasks) {
            await updateBundleMutation.mutateAsync({
              bundleId: activeBundle.bundleId,
              taskIds: activeBundle.taskIds,
            })
          }
          resolvedBundleId = activeBundle.bundleId
        }
      } else if (task.bundleId != null) {
        resolvedBundleId = task.bundleId
      }

      const pluginQueryParams = Object.assign(
        {},
        ...extensions.map(
          (extension) => extension.getStatusQueryParams?.(formState, { newStatus, task }) ?? {}
        )
      )

      if (resolvedBundleId != null) {
        await updateBundleStatusMutation.mutateAsync({
          bundleId: resolvedBundleId,
          primaryId: task.id,
          status: newStatus,
          tags: tagList,
          queryParams: pluginQueryParams,
        })
      } else {
        await updateTaskStatusMutation.mutateAsync({
          taskId: task.id,
          status: newStatus,
          options: {
            tags: tagList,
            queryParams: pluginQueryParams,
          },
        })
      }

      // Answers to any form fields embedded in the challenge's instructions.
      // Saved after the status change, which has already succeeded on the
      // server — a failure here must not fail the whole submission.
      if (completionResponses && Object.keys(completionResponses.responses).length > 0) {
        try {
          await updateCompletionResponsesMutation.mutateAsync({
            taskId: task.id,
            responses: completionResponses.responses,
          })
        } catch (error) {
          logger.error('Failed to save completion responses', { taskId: task.id, error })
          toast.error(
            t(
              'taskEditPage.taskActionModal.toast.responsesFailed',
              undefined,
              'The task status was saved, but your answers to the form could not be.'
            )
          )
        }
      }

      if (comment.trim()) {
        try {
          await addTaskCommentMutation.mutateAsync({
            taskId: task.id,
            commentText: comment.trim(),
          })
        } catch (error) {
          logger.error('Failed to add task comment', { taskId: task.id, error })
          toast.error(
            t(
              'taskEditPage.taskActionModal.toast.commentFailed',
              undefined,
              'The task status was saved, but your comment could not be.'
            )
          )
        }
      }

      if (nextTaskType !== readNextTaskType(user?.properties)) saveNextTaskType(nextTaskType)

      toast.success(
        t(
          'taskEditPage.taskActionModal.toast.markedAs',
          { status: getStatusLabel(t, newStatus) ?? String(newStatus) },
          'Task marked as {status}'
        )
      )

      if (nextTaskType === 'nearby' && selectedNearbyTaskId) {
        await navigateToTask(selectedNearbyTaskId)
      } else {
        toast.info(
          t('taskEditPage.taskActionModal.toast.loadingNext', undefined, 'Loading next task...')
        )
        try {
          const taskCandidates =
            nextTaskType === 'nearby'
              ? await api.challenge.fetchTasksNearby(task.parent, task.id, 1)
              : await api.challenge.getRandomTask(task.parent)
          if (taskCandidates && taskCandidates.length > 0) {
            await navigateToTask(taskCandidates[0].id)
          } else {
            toast.info(
              t(
                'common.noMoreTasksInChallenge',
                undefined,
                'No more tasks available in this challenge'
              )
            )
            await navigate({
              to: '/challenge/$challengeId',
              params: { challengeId: String(task.parent) },
            })
          }
        } catch {
          toast.error(t('common.failedToLoadNextTask', undefined, 'Failed to load next task'))
          await navigate({
            to: '/challenge/$challengeId',
            params: { challengeId: String(task.parent) },
          })
        }
      }

      onOpenChange(false)
    } catch (error) {
      const isLockConflict = await lockConflict.handleError(error, () => {
        void handleSubmit()
      })
      if (isLockConflict) return

      logger.error('Error updating task', { error })
      toast.error(
        (await getApiErrorMessage(error)) ??
          t(
            'taskEditPage.taskActionModal.toast.updateFailed',
            undefined,
            'Failed to update task. Please try again.'
          )
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  // handleSubmit closes over the comment, status and tags as they stand this
  // render. The registered shortcut has to stay referentially stable, so it
  // goes through a ref rather than capturing one render's version and
  // submitting whatever the mapper had typed at the time.
  const submitRef = useRef(handleSubmit)
  submitRef.current = handleSubmit

  // Reason: stable shortcut definitions for keyboard handler registration
  const submitShortcuts: KeyboardShortcut[] = useMemo(
    () =>
      SUBMIT_BINDINGS.map((binding) => ({
        ...binding,
        description: t(
          'taskEditPage.taskActionModal.submitShortcut',
          undefined,
          'Submit this confirmation'
        ),
        category: 'taskActions' as const,
        handler: () => {
          if (!isSubmitting) void submitRef.current()
        },
        enabled: open && !isSubmitting,
        // Belongs to the dialog, and has to work from inside the comment box.
        allowWhileTyping: true,
        allowWhileSuspended: true,
      })),
    [open, isSubmitting, t]
  )
  useRegisterShortcuts('task-action-modal', submitShortcuts)

  const handleCancel = () => {
    setComment('')
    setTags('')
    setNewStatus(initialStatus)
    setSelectedNearbyTaskId(null)
    setFormState({})
    onOpenChange(false)
  }

  const saveNextTaskType = (value: NextTaskType) => {
    setNextTaskType(value)
    if (!user?.id) return
    updateUserSettingsMutation.mutate({
      userId: user.id,
      settings: user.settings ?? {},
      properties: withAppSetting(
        user.properties,
        LOAD_METHOD_APP_ID,
        LOAD_METHOD_KEY,
        value === 'nearby' ? 'proximity' : 'random'
      ),
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          size="xl"
          className="max-h-[90vh] overflow-y-auto"
          // The comment is the only thing a mapper is likely to type here, so
          // it takes focus instead of the dialog's own close button.
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            commentRef.current?.focus()
          }}
          onAnimationEnd={(event) => {
            if (event.target === event.currentTarget && open) setAnimationDone(true)
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {t('taskEditPage.taskActionModal.title', undefined, 'Complete Task Action')}
            </DialogTitle>
            <DialogDescription>
              {t(
                'taskEditPage.taskActionModal.description',
                undefined,
                'Update the task status and optionally add a comment or tags'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Status Transition */}
            <div className="space-y-2">
              <Label>
                {t('taskEditPage.taskActionModal.statusChange', undefined, 'Status Change')}
              </Label>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 dark:bg-slate-700">
                  <span className="font-medium text-sm">
                    {getStatusLabel(t, currentStatus) || t('common.unknown', undefined, 'Unknown')}
                  </span>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-500" />
                <Select
                  value={String(newStatus)}
                  onValueChange={(value) => setNewStatus(Number(value))}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <Label htmlFor={commentId}>
                {t('taskEditPage.taskActionModal.commentLabel', undefined, 'Comment (Optional)')}
              </Label>
              <Textarea
                id={commentId}
                ref={commentRef}
                placeholder={t(
                  'taskEditPage.taskActionModal.commentPlaceholder',
                  undefined,
                  'Add any notes or comments about this task...'
                )}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor={tagsId}>
                {t('taskEditPage.taskActionModal.tagsLabel', undefined, 'Tags (Optional)')}
              </Label>
              <Input
                id={tagsId}
                placeholder={t(
                  'taskEditPage.taskActionModal.tagsPlaceholder',
                  undefined,
                  'Enter tags separated by commas (e.g., needs-review, complex)'
                )}
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-zinc-500">
                {t(
                  'taskEditPage.taskActionModal.tagsHint',
                  undefined,
                  'Separate multiple tags with commas'
                )}
              </p>
            </div>

            {extensions.map((extension) => {
              const ExtensionComponent = extension.component
              if (!ExtensionComponent) return null
              return (
                <div
                  key={extension.id}
                  className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-slate-700"
                >
                  <ExtensionComponent
                    task={task}
                    newStatus={newStatus}
                    setNewStatus={setNewStatus}
                    formState={formState}
                    setFormState={(patch) => setFormState((prev) => ({ ...prev, ...patch }))}
                  />
                </div>
              )
            })}

            {/* Next Task Selection */}
            <div className="space-y-3">
              <Label>{t('taskEditPage.taskActionModal.nextTask', undefined, 'Next Task')}</Label>
              <RadioGroup
                value={nextTaskType}
                onValueChange={(value) => setNextTaskType(value as NextTaskType)}
              >
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="random" id={randomId} className="mt-1" />
                    <div className="flex-1">
                      <Label
                        htmlFor={randomId}
                        className="flex cursor-pointer items-center gap-2 font-medium"
                      >
                        <Shuffle className="h-4 w-4" />
                        {t(
                          'taskEditPage.taskActionModal.randomTask.label',
                          undefined,
                          'Random High Priority Task'
                        )}
                      </Label>
                      <p className="mt-1 text-xs text-zinc-500">
                        {t(
                          'taskEditPage.taskActionModal.randomTask.description',
                          undefined,
                          'Load the next highest priority task from this challenge'
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value="nearby" id={nearbyId} className="mt-1" />
                    <div className="flex-1">
                      <Label
                        htmlFor={nearbyId}
                        className="flex cursor-pointer items-center gap-2 font-medium"
                      >
                        <MapPin className="h-4 w-4" />
                        {t(
                          'taskEditPage.taskActionModal.nearbyTask.label',
                          undefined,
                          'Nearby Task'
                        )}
                      </Label>
                      <p className="mt-1 text-xs text-zinc-500">
                        {t(
                          'taskEditPage.taskActionModal.nearbyTask.description',
                          undefined,
                          'Select a task near the current one, or auto-select the nearest'
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>

              {/* Nearby Map */}
              {nextTaskType === 'nearby' && (
                <div className="mt-3 rounded-lg border border-zinc-200 p-3 dark:border-slate-700">
                  {animationDone ? (
                    <TaskNearbyMap
                      currentTask={task}
                      selectedTaskId={selectedNearbyTaskId}
                      onTaskSelect={setSelectedNearbyTaskId}
                    />
                  ) : (
                    <div className="h-64 w-full rounded-lg bg-zinc-100 dark:bg-slate-800" />
                  )}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCancel} disabled={isSubmitting}>
              {t('common.cancel', undefined, 'Cancel')}
            </Button>
            <Button variant="outline" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting
                ? t('common.submitting', undefined, 'Submitting...')
                : t(
                    'taskEditPage.taskActionModal.completeAndContinue',
                    undefined,
                    'Complete & Continue'
                  )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <LockConflictModal
        conflict={lockConflict.conflict}
        onConfirm={lockConflict.confirm}
        onCancel={lockConflict.cancel}
        busy={lockConflict.isReleasing}
      />
    </>
  )
}
