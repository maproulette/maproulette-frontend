import { useLoaderData, useNavigate, useSearch } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useAuthContext } from '@/contexts/AuthContext'
import { usePluginContext } from '@/contexts/PluginContext'
import { useWebSocketContext } from '@/contexts/WebSocketContext'
import { useIntl } from '@/i18n'
import { getLockConflictInfo, type LockConflictInfo } from '@/lib/apiError'
import { logger } from '@/lib/logger'
import type { TaskGetResponse } from '@/types/Task'
import type { TaskEventMessage, TasksEventMessage } from '@/types/WebSocket'
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
  lockTask: () => void
  unlockTask: () => void
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
  const { lastMessage } = useWebSocketContext()
  const { t } = useIntl()
  const lockTaskMutation = api.task.useLockTask()
  const unlockTaskMutation = api.task.useUnlockTask()
  const refreshLockMutation = api.task.useRefreshLock()
  const hasAttemptedLock = useRef(false)
  const [isLocked, setIsLocked] = useState(false)
  const [lockedTasks, setLockedTasks] = useState<number[]>([])
  const [lockConflict, setLockConflict] = useState<LockConflictInfo | null>(null)

  const lockedTaskIdRef = useRef<number | null>(null)

  const isEditable = isBaseEditableStatus(task.status) || isTaskEditableByPlugins(task)

  // Clears local lock state after `id`'s lock is confirmed gone (release, expiry, or a
  // conflicting claim elsewhere) - only nulls the ref if it still points at that same task,
  // since a newer lock may have already superseded it.
  const clearLockState = useCallback((id: number) => {
    setIsLocked(false)
    setLockedTasks([])
    if (lockedTaskIdRef.current === id) {
      lockedTaskIdRef.current = null
    }
  }, [])

  const attemptLock = useCallback(
    (taskId: number) => {
      lockTaskMutation.mutate(taskId, {
        onSuccess: (data) => {
          setIsLocked(true)
          lockedTaskIdRef.current = taskId
          setLockedTasks(data.lockBundledTasks.filter((id) => id !== taskId))
          navigate({
            to: '/tasks/$taskId',
            params: { taskId: String(taskId) },
            search: (prev) => ({ ...prev, claimTask: undefined }),
            replace: true,
          })
        },
        onError: async (error) => {
          setIsLocked(false)
          const conflict = await getLockConflictInfo(error)
          if (conflict) {
            setLockConflict(conflict)
            return
          }
          logger.error('Failed to lock task', { taskId, error })
          toast.error(
            t(
              'taskEditPage.taskActions.lockButton.lockConflict',
              undefined,
              'This task is currently locked by another mapper. Try again later or pick a different task.'
            )
          )
        },
      })
    },
    [lockTaskMutation, navigate, t]
  )

  useEffect(() => {
    hasAttemptedLock.current = false
    setIsLocked(false)
    setLockedTasks([])
    setLockConflict(null)
  }, [task?.id])

  // Reflect a lock we already hold. Locks are one-per-user, so the same account opening
  // this task in a second tab (or reloading without ?claimTask) already owns the lock the
  // backend now reports via task.lockedBy - render it as locked-by-me instead of free.
  //
  // We deliberately do NOT set lockedTaskIdRef here: that ref drives release-on-unmount and
  // the keep-alive refresh, and it belongs to whichever tab actually acquired the lock. A
  // passive second view claiming it would release the shared lock out from under the owning
  // tab when this one unmounts (and, synchronously set, immediately in dev StrictMode).
  // Explicit unlock from this tab still works - unlockTask() releases by task.id, not the ref.
  // A lock held by a *different* user is left alone (surfaced through the normal conflict flow).
  useEffect(() => {
    if (!task || !isAuthenticated || !user || hasAttemptedLock.current) return
    if (task.lockedBy == null || task.lockedBy !== user.id) return

    hasAttemptedLock.current = true
    setIsLocked(true)
    setLockedTasks((task.lockBundledTasks ?? []).filter((id) => id !== task.id))
  }, [task, isAuthenticated, user])

  useEffect(() => {
    if (!shouldClaimTask || !task || !isAuthenticated || hasAttemptedLock.current) return
    if (!isEditable) return
    if (challenge?.paused) return

    hasAttemptedLock.current = true
    attemptLock(task.id)
  }, [shouldClaimTask, task, isAuthenticated, isEditable, challenge?.paused, attemptLock])

  // We deliberately do NOT release the lock on unmount (navigating away, closing the tab,
  // or reloading). A lock is given up only two ways: deliberately (the unlock button, or
  // completing/skipping the task) or by expiring on the backend once the keep-alive below
  // stops refreshing it. This lets a mapper leave and come back - or reload - without losing
  // their claim, and keeps the task visible in their dashboard "locked tasks" list meanwhile.
  // (With one-lock-per-user semantics, claiming a different task still releases this one
  // server-side, so leaving to work elsewhere does not strand the lock.)

  useEffect(() => {
    if (!isLocked) return

    // Silent keep-alive only - just extends locked_time so an actively-open
    // task doesn't hit the backend's 1-hour lock expiry. Any actual conflict
    // (another tab now holds a different task under this account) surfaces
    // through the normal claim-a-different-task flow (attemptLock above),
    // not from this background timer.
    const interval = setInterval(() => {
      const id = lockedTaskIdRef.current
      if (id != null) {
        refreshLockMutation.mutate(id, {
          onError: () => clearLockState(id),
        })
      }
    }, LOCK_REFRESH_INTERVAL_MS)

    return () => clearInterval(interval)
  }, [isLocked, refreshLockMutation.mutate, clearLockState])

  useEffect(() => {
    if (!task || !lastMessage || typeof lastMessage !== 'object') return
    const message = lastMessage as Partial<TaskEventMessage>
    if (message.messageType !== 'task-released' && message.messageType !== 'task-claimed') return
    if (message.data?.task?.id !== task.id) return

    if (message.messageType === 'task-released') {
      clearLockState(task.id)
      return
    }

    const claimedByMe = message.data.byUser == null || message.data.byUser.userId === user?.id
    setIsLocked(claimedByMe)
    if (!claimedByMe) {
      lockedTaskIdRef.current = null
    }
  }, [lastMessage, task, user?.id, clearLockState])

  useEffect(() => {
    if (!task || !lastMessage || typeof lastMessage !== 'object') return
    const message = lastMessage as Partial<TasksEventMessage>
    if (message.messageType !== 'tasks-claimed' && message.messageType !== 'tasks-released') return
    const tasks = message.data?.tasks
    if (!tasks?.some((t) => t.id === task.id)) return
    const byMe = message.data?.byUser == null || message.data.byUser.userId === user?.id
    if (!byMe) return

    if (message.messageType === 'tasks-released') {
      setLockedTasks([])
      return
    }

    setLockedTasks(tasks.map((t) => t.id).filter((id) => id !== task.id))
    setIsLocked(true)
  }, [lastMessage, task, user?.id])

  useEffect(() => {
    if (isLocked && lockConflict) {
      setLockConflict(null)
    }
  }, [isLocked, lockConflict])

  const lockTask = useCallback(() => {
    if (!task || challenge?.paused) return
    attemptLock(task.id)
  }, [task, challenge?.paused, attemptLock])

  const unlockTask = useCallback(() => {
    if (!task) return
    unlockTaskMutation.mutate(task.id, {
      onSuccess: () => clearLockState(task.id),
    })
  }, [task, unlockTaskMutation, clearLockState])

  const handleConfirmSwitchLock = useCallback(() => {
    if (!task || !lockConflict) return
    unlockTaskMutation.mutate(lockConflict.lockedTaskId, {
      onSettled: () => {
        setLockConflict(null)
        attemptLock(task.id)
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

export const useTaskContext = () => {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error('useTask must be used within an TaskProvider')
  }
  return context
}
