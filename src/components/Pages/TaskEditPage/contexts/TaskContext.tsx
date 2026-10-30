import { useQueryClient } from '@tanstack/react-query'
import { useLoaderData, useNavigate, useSearch } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useAuthContext } from '@/contexts/AuthContext'
import { usePluginContext } from '@/contexts/PluginContext'
import { useIntl } from '@/i18n'
import { getLockConflictInfo, type LockConflictInfo } from '@/lib/apiError'
import { logger } from '@/lib/logger'
import type { TaskGetResponse } from '@/types/Task'
import { LockConflictDialog } from './LockConflictDialog'

// Statuses that allow editing: Created (0), Skipped (3), Too Hard/Can't Complete (6)
export const EDITABLE_STATUSES = [0, 3, 6]

export const isBaseEditableStatus = (status: number | null | undefined): boolean =>
  EDITABLE_STATUSES.includes(status ?? 0)

// Well under the backend's 1-hour lock expiry (see Config.DEFAULT_TASK_LOCK_EXPIRY),
// so an actively-open task never gets silently expired out from under the user.
const LOCK_REFRESH_INTERVAL_MS = 15 * 60 * 1000

export interface TaskContextType {
  task: TaskGetResponse
  isEditable: boolean
  isLocked: boolean
  isLocking: boolean
  lockedTasks: number[]
  lockTask: () => Promise<boolean>
  unlockTask: () => Promise<boolean>
}

export const TaskContext = createContext<TaskContextType | undefined>(undefined)

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const { task: loaderTask, challenge } = useLoaderData({ from: '/_app/tasks/$taskId/' })
  const { claimTask: shouldClaimTask } = useSearch({ from: '/_app/tasks/$taskId/' })
  const navigate = useNavigate()
  const { data: liveTask } = api.task.getTask(loaderTask.id)
  const task = liveTask ?? loaderTask
  const { user, isAuthenticated } = useAuthContext()
  const { isTaskEditableByPlugins } = usePluginContext()
  const { t } = useIntl()
  const queryClient = useQueryClient()
  const lockTaskMutation = api.task.useLockTask()
  const unlockTaskMutation = api.task.useUnlockTask()
  const refreshLockMutation = api.task.useRefreshLock()
  const hasAttemptedLock = useRef(false)
  const [lockConflict, setLockConflict] = useState<LockConflictInfo | null>(null)

  const isEditable = isBaseEditableStatus(task.status) || isTaskEditableByPlugins(task)
  const isLocked = user != null && task.lockedBy === user.id
  const lockedTasks = useMemo(
    () => (isLocked ? (task.lockBundledTasks ?? []).filter((id) => id !== task.id) : []),
    [isLocked, task.lockBundledTasks, task.id]
  )

  const attemptLock = useCallback(
    async (taskId: number): Promise<boolean> => {
      try {
        await lockTaskMutation.mutateAsync(taskId)
        navigate({
          to: '/tasks/$taskId',
          params: { taskId: String(taskId) },
          search: (prev) => ({ ...prev, claimTask: undefined }),
          replace: true,
        })
        return true
      } catch (error) {
        const conflict = await getLockConflictInfo(error)
        if (conflict) {
          setLockConflict(conflict)
          return false
        }
        logger.error('Failed to lock task', { taskId, error })
        toast.error(
          t(
            'taskEditPage.taskActions.lockButton.lockConflict',
            undefined,
            'This task is currently locked by another mapper. Try again later or pick a different task.'
          )
        )
        return false
      }
    },
    [lockTaskMutation.mutateAsync, navigate, t]
  )

  useEffect(() => {
    hasAttemptedLock.current = false
    setLockConflict(null)
  }, [task?.id])

  useEffect(() => {
    if (!shouldClaimTask || !task || !isAuthenticated || hasAttemptedLock.current) return
    if (isLocked || !isEditable) return
    if (challenge?.paused) return

    hasAttemptedLock.current = true
    void attemptLock(task.id)
  }, [shouldClaimTask, task, isAuthenticated, isLocked, isEditable, challenge?.paused, attemptLock])

  // We deliberately do NOT release the lock on unmount (navigating away, closing the tab,
  // or reloading). A lock is given up only two ways: deliberately (the unlock button, or
  // completing/skipping the task) or by expiring on the backend once the keep-alive below
  // stops refreshing it. This lets a mapper leave and come back - or reload - without losing
  // their claim, and keeps the task visible in their dashboard "locked tasks" list meanwhile.
  // Claiming a different task while this one is still held is refused by the backend and
  // offered as a switch through the lock conflict dialog.

  const taskId = task.id
  useEffect(() => {
    if (!isLocked) return

    // Silent keep-alive only - just extends locked_time so an actively-open task doesn't hit
    // the backend's 1-hour lock expiry.
    const interval = setInterval(() => {
      refreshLockMutation.mutate(taskId, {
        onError: () => {
          void queryClient.invalidateQueries({ queryKey: ['task', taskId], exact: true })
        },
      })
    }, LOCK_REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isLocked, taskId, refreshLockMutation.mutate, queryClient])

  useEffect(() => {
    if (isLocked && lockConflict) {
      setLockConflict(null)
    }
  }, [isLocked, lockConflict])

  const lockTask = useCallback(async () => {
    if (!task || challenge?.paused) return false
    return attemptLock(task.id)
  }, [task, challenge?.paused, attemptLock])

  const unlockTask = useCallback(async () => {
    if (!task) return false
    try {
      await unlockTaskMutation.mutateAsync(task.id)
      return true
    } catch (error) {
      logger.error('Failed to unlock task', { taskId: task.id, error })
      toast.error(
        t('taskEditPage.taskActions.lockButton.unlockFailed', undefined, 'Failed to unlock task')
      )
      return false
    }
  }, [task, unlockTaskMutation.mutateAsync, t])

  const handleConfirmSwitchLock = useCallback(() => {
    if (!task || !lockConflict) return
    unlockTaskMutation.mutate(lockConflict.lockedTaskId, {
      onSettled: () => {
        setLockConflict(null)
        void attemptLock(task.id)
      },
    })
  }, [task, lockConflict, unlockTaskMutation, attemptLock])

  const value: TaskContextType = useMemo(
    () => ({
      task,
      isEditable,
      isLocked,
      isLocking: lockTaskMutation.isPending,
      lockedTasks,
      lockTask,
      unlockTask,
    }),
    [task, isEditable, isLocked, lockTaskMutation.isPending, lockedTasks, lockTask, unlockTask]
  )

  return (
    <TaskContext.Provider value={value}>
      {children}
      <LockConflictDialog
        conflict={lockConflict}
        onOpenChange={(open) => {
          if (!open) setLockConflict(null)
        }}
        onConfirm={handleConfirmSwitchLock}
        busy={unlockTaskMutation.isPending}
      />
    </TaskContext.Provider>
  )
}

/** Null where no task is in scope; the panels are also used outside a task route. */
export const useOptionalTaskContext = () => useContext(TaskContext)

export const useTaskContext = () => {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTask must be used within an TaskProvider')
  }
  return context
}
