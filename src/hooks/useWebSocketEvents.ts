import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { invalidateChallengeAggregates, patchChallengeTaskMarker } from '@/api/challenge/single'
import { invalidateLockedTasks } from '@/api/task/single'
import { useAuthContext } from '@/contexts/AuthContext'
import { useCongratulate } from '@/contexts/CongratulateContext'
import { useWebSocketContext } from '@/contexts/WebSocketContext'
import { wsLogger } from '@/lib/logger'
import type { TaskGetResponse } from '@/types/Task'
import type {
  AchievementAwardedMessage,
  NotificationNewMessage,
  ReviewEventMessage,
  TaskEventMessage,
  TasksEventMessage,
  TeamUpdateMessage,
  WebSocketMessageTypes,
} from '@/types/WebSocket'

const isAchievementMessage = (m: WebSocketMessageTypes): m is AchievementAwardedMessage =>
  m.messageType === 'achievement-awarded'

const isNotificationMessage = (m: WebSocketMessageTypes): m is NotificationNewMessage =>
  m.messageType === 'notification-new'

const isTaskEvent = (m: WebSocketMessageTypes): m is TaskEventMessage =>
  m.messageType === 'task-claimed' ||
  m.messageType === 'task-released' ||
  m.messageType === 'task-completed' ||
  m.messageType === 'task-update'

const isTasksEvent = (m: WebSocketMessageTypes): m is TasksEventMessage =>
  m.messageType === 'tasks-claimed' ||
  m.messageType === 'tasks-released' ||
  m.messageType === 'tasks-update' ||
  m.messageType === 'tasks-completed'

const isReviewEvent = (m: WebSocketMessageTypes): m is ReviewEventMessage =>
  m.messageType === 'review-new' ||
  m.messageType === 'review-claimed' ||
  m.messageType === 'review-update'

const isTeamUpdate = (m: WebSocketMessageTypes): m is TeamUpdateMessage =>
  m.messageType === 'team-update'

// Invalidate the caches that back the current user's own profile/score display -
// shared by every message type that can affect them (achievement, task/tasks completed).
const invalidateOwnUserQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: number
) => {
  queryClient.invalidateQueries({ queryKey: ['user', 'whoami'] })
  queryClient.invalidateQueries({ queryKey: ['user', userId] })
}

/**
 * Centralized dispatcher for WebSocket events coming from the backend.
 * Mount once at the app root (AppLayout).
 */
export const useWebSocketEvents = () => {
  const { lastMessage, subscribe } = useWebSocketContext()
  const { user } = useAuthContext()
  const { enqueue } = useCongratulate()
  const queryClient = useQueryClient()
  const seenRef = useRef<WeakSet<object>>(new WeakSet())

  // Subscribe to the task stream so we can listen for task-completed on our own tasks
  useEffect(() => {
    subscribe('tasks')
  }, [subscribe])

  useEffect(() => {
    if (!lastMessage || typeof lastMessage !== 'object') return
    if (seenRef.current.has(lastMessage as object)) return
    seenRef.current.add(lastMessage as object)

    try {
      if (isAchievementMessage(lastMessage)) {
        if (user && lastMessage.data.userId === user.id) {
          lastMessage.data.achievement.forEach((id) => {
            enqueue({ kind: 'achievement', achievementId: id })
          })
          invalidateOwnUserQueries(queryClient, user.id)
        }
        return
      }

      if (isTaskEvent(lastMessage)) {
        const messageType = lastMessage.messageType
        const taskId = lastMessage.data.task.id
        const challengeId = lastMessage.data.challenge?.id ?? lastMessage.data.task.parent
        // Lock events (claimed/released) carry a task snapshot taken at lock time, not a
        // status change. When a status change also releases the lock, the backend emits the
        // release from a pre-update snapshot (stale status) alongside the authoritative
        // task-update / task-completed event, and the two race. Applying status from the lock
        // event would flip the cache back to the old status - the "fixed -> created -> fixed"
        // flicker. So only status-bearing events drive status here.
        const isLockEvent = messageType === 'task-claimed' || messageType === 'task-released'
        const newStatus = isLockEvent ? undefined : (lastMessage.data.task.status ?? undefined)

        const cachedTask = queryClient.getQueryData<TaskGetResponse>(['task', taskId])
        const oldStatus = cachedTask?.status ?? undefined

        // Patch the cached task with the new status instead of refetching.
        if (newStatus !== undefined && cachedTask) {
          queryClient.setQueryData<TaskGetResponse>(['task', taskId], {
            ...cachedTask,
            status: newStatus,
          })
        }

        // Surgically patch the marker entry in the challenge's marker list.
        const markerPatch: Parameters<typeof patchChallengeTaskMarker>[3] = {}
        if (newStatus !== undefined) markerPatch.status = newStatus
        if (messageType === 'task-claimed') {
          markerPatch.lockedBy = lastMessage.data.byUser?.userId ?? null
        } else if (messageType === 'task-released') {
          markerPatch.lockedBy = null
        }
        if (Object.keys(markerPatch).length > 0) {
          patchChallengeTaskMarker(queryClient, challengeId, taskId, markerPatch)
        }

        // History always changes (every event creates a history entry); we can't
        // hydrate it from the message payload alone.
        queryClient.invalidateQueries({ queryKey: ['task', 'history', taskId] })

        // Aggregates only go stale when status actually changed. Lock/unlock
        // and unchanged-status updates leave counts untouched.
        const statusChanged = newStatus !== undefined && newStatus !== oldStatus
        if (statusChanged) {
          invalidateChallengeAggregates(queryClient, challengeId)
        }

        // The current user's own lock state changed (they claimed, released, or completed a
        // task), so refresh their locked-tasks list (e.g. the dashboard block).
        if (user && lastMessage.data.byUser?.userId === user.id) {
          invalidateLockedTasks(queryClient)
        }

        if (
          messageType === 'task-completed' &&
          user &&
          lastMessage.data.byUser?.userId === user.id
        ) {
          invalidateOwnUserQueries(queryClient, user.id)
        }
        return
      }

      if (isTasksEvent(lastMessage)) {
        const messageType = lastMessage.messageType
        const invalidatedChallenges = new Set<number>()
        const historyTaskIds = new Set<number>()

        // Lock events (claimed/released) carry a pre-update task snapshot, so their status is
        // stale when a status change also releases the lock. Only status-bearing events drive
        // status; see the isTaskEvent branch above for the full rationale.
        const isLockEvent = messageType === 'tasks-claimed' || messageType === 'tasks-released'

        lastMessage.data.tasks.forEach((bundledTask) => {
          const challengeId = lastMessage.data.challenge?.id ?? bundledTask.parent
          const newStatus = isLockEvent ? undefined : (bundledTask.status ?? undefined)

          const cachedTask = queryClient.getQueryData<TaskGetResponse>(['task', bundledTask.id])
          const oldStatus = cachedTask?.status ?? undefined
          if (cachedTask) {
            queryClient.setQueryData<TaskGetResponse>(['task', bundledTask.id], {
              ...cachedTask,
              status: newStatus ?? cachedTask.status,
              bundleId: bundledTask.bundleId ?? cachedTask.bundleId,
              isBundlePrimary: bundledTask.isBundlePrimary ?? cachedTask.isBundlePrimary,
            })
          }

          const markerPatch: Parameters<typeof patchChallengeTaskMarker>[3] = {}
          if (newStatus !== undefined) markerPatch.status = newStatus
          if (messageType === 'tasks-claimed') {
            markerPatch.lockedBy = lastMessage.data.byUser?.userId ?? null
          } else if (messageType === 'tasks-released') {
            markerPatch.lockedBy = null
          }
          if (Object.keys(markerPatch).length > 0) {
            patchChallengeTaskMarker(queryClient, challengeId, bundledTask.id, markerPatch)
          }

          historyTaskIds.add(bundledTask.id)

          const statusChanged = newStatus !== undefined && newStatus !== oldStatus
          if (statusChanged && !invalidatedChallenges.has(challengeId)) {
            invalidatedChallenges.add(challengeId)
            invalidateChallengeAggregates(queryClient, challengeId)
          }
        })

        if (historyTaskIds.size > 0) {
          // One cache scan for the whole bundle instead of one invalidateQueries call per task.
          queryClient.invalidateQueries({
            predicate: (query) =>
              query.queryKey[0] === 'task' &&
              query.queryKey[1] === 'history' &&
              historyTaskIds.has(query.queryKey[2] as number),
          })
        }

        // The current user's own lock state changed for this bundle, so refresh their
        // locked-tasks list (e.g. the dashboard block).
        if (user && lastMessage.data.byUser?.userId === user.id) {
          invalidateLockedTasks(queryClient)
        }

        if (
          messageType === 'tasks-completed' &&
          user &&
          lastMessage.data.byUser?.userId === user.id
        ) {
          invalidateOwnUserQueries(queryClient, user.id)
        }
        return
      }

      if (isReviewEvent(lastMessage)) {
        const taskId = lastMessage.data.taskWithReview.task.id
        const challengeId = lastMessage.data.taskWithReview.task.parent
        queryClient.invalidateQueries({ queryKey: ['task', taskId] })
        queryClient.invalidateQueries({ queryKey: ['task', 'history', taskId] })
        invalidateChallengeAggregates(queryClient, challengeId)
        return
      }

      if (isTeamUpdate(lastMessage)) {
        queryClient.invalidateQueries({ queryKey: ['team', lastMessage.data.teamId] })
        queryClient.invalidateQueries({ queryKey: ['user', user?.id, 'teamMemberships'] })
        return
      }

      if (isNotificationMessage(lastMessage)) {
        queryClient.invalidateQueries({ queryKey: ['user', 'notifications'] })
        return
      }
    } catch (error) {
      wsLogger.warn('WebSocket dispatch error', { error })
    }
  }, [lastMessage, user, enqueue, queryClient])
}
