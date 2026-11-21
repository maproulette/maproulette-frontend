import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidateChallengeAggregates, patchChallengeTaskMarker } from '@/api/challenge/single'
import type { TaskBundleLockResponse, TaskGetResponse, TaskStartResponse } from '@/types/Task'
import type { UserWhoamiResponse } from '@/types/User'
import { apiRequest } from '../client'
import { userKeys } from '../user/keys'

const getCurrentUserId = (queryClient: ReturnType<typeof useQueryClient>): number | null => {
  const me = queryClient.getQueryData<UserWhoamiResponse>(userKeys.whoami)
  return (me as { id?: number } | undefined)?.id ?? null
}

export const LOCKED_TASKS_INVALIDATION_DELAY_MS = 300

const pendingLockedTasksInvalidations = new WeakMap<
  ReturnType<typeof useQueryClient>,
  ReturnType<typeof setTimeout>
>()

/**
 * Refresh the current user's "locked tasks" list (e.g. the dashboard block). Called whenever
 * their lock state changes - lock, unlock, or a status change that releases the lock - so the
 * list reflects reality without waiting for the 60s stale window.
 */
export const invalidateLockedTasks = (queryClient: ReturnType<typeof useQueryClient>): void => {
  clearTimeout(pendingLockedTasksInvalidations.get(queryClient))
  pendingLockedTasksInvalidations.set(
    queryClient,
    setTimeout(() => {
      pendingLockedTasksInvalidations.delete(queryClient)
      const userId = getCurrentUserId(queryClient)
      if (userId != null) {
        queryClient.invalidateQueries({ queryKey: ['user', userId, 'lockedTasks'] })
      }
    }, LOCKED_TASKS_INVALIDATION_DELAY_MS)
  )
}

export const taskSingle = {
  getTaskOptions: (taskId: number) =>
    queryOptions({
      queryKey: ['task', taskId],
      queryFn: () =>
        apiRequest
          .get(`api/v2/task/${taskId}`, { searchParams: { mapillary: false } })
          .json<TaskGetResponse>(),
      enabled: !!taskId,
    }),

  getTask: (taskId: number) => useQuery(taskSingle.getTaskOptions(taskId)),

  // Mutation hooks
  useLockTask: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (taskId: number) =>
        apiRequest.get(`api/v2/task/${taskId}/start`).json<TaskStartResponse>(),
      onSuccess: (lockedTask, taskId) => {
        queryClient.setQueryData<TaskGetResponse>(['task', taskId], {
          ...lockedTask,
          lockedBy: getCurrentUserId(queryClient),
        })
        queryClient.invalidateQueries({ queryKey: ['task', 'history', taskId] })
        invalidateLockedTasks(queryClient)
        if (lockedTask?.parent) {
          patchChallengeTaskMarker(queryClient, lockedTask.parent, taskId, {
            lockedBy: getCurrentUserId(queryClient),
          })
        }
      },
    })
  },

  useRefreshLock: () =>
    useMutation({
      mutationFn: (taskId: number) =>
        apiRequest.get(`api/v2/task/${taskId}/refreshLock`).json<TaskStartResponse>(),
    }),

  useRequestUnlock: () =>
    useMutation({
      mutationFn: (taskId: number) => apiRequest.put(`api/v2/task/${taskId}/unlock/request`).text(),
    }),

  useUnlockTask: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (taskId: number) =>
        apiRequest.get(`api/v2/task/${taskId}/release`).json<TaskGetResponse>(),
      onSuccess: (unlockedTask, taskId) => {
        queryClient.setQueryData<TaskGetResponse>(['task', taskId], {
          ...unlockedTask,
          lockedBy: null,
          lockBundledTasks: [],
        })
        queryClient.invalidateQueries({ queryKey: ['task', 'history', taskId] })
        invalidateLockedTasks(queryClient)
        if (unlockedTask?.parent) {
          patchChallengeTaskMarker(queryClient, unlockedTask.parent, taskId, {
            lockedBy: null,
          })
        }
      },
    })
  },

  useLockTaskBundle: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ taskId, taskIds }: { taskId: number; taskIds: number[] }) => {
        const searchParams = new URLSearchParams()
        taskIds.forEach((id) => {
          searchParams.append('taskIds', String(id))
        })
        return apiRequest
          .put(`api/v2/task/${taskId}/lockBundle`, { searchParams })
          .json<TaskBundleLockResponse>()
      },
      onSuccess: (lock, { taskId }) => {
        const lockedBy = getCurrentUserId(queryClient)
        for (const id of new Set([taskId, lock.lockPrimaryTaskId, ...lock.lockBundledTasks])) {
          queryClient.setQueryData<TaskGetResponse>(
            ['task', id],
            (cached) => cached && { ...cached, lockedBy, lockBundledTasks: lock.lockBundledTasks }
          )
        }
        invalidateLockedTasks(queryClient)
      },
    })
  },

  useSkipTask: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (taskId: number) => apiRequest.post(`api/v2/task/${taskId}/skip`).text(),
      onSuccess: (_data, taskId) => {
        queryClient.setQueryData<TaskGetResponse>(
          ['task', taskId],
          (cached) => cached && { ...cached, lockedBy: null, lockBundledTasks: [] }
        )
        queryClient.invalidateQueries({ queryKey: ['task', 'history', taskId] })
        invalidateLockedTasks(queryClient)
      },
    })
  },

  updateTask: async (taskId: number, body: TaskGetResponse) => {
    return apiRequest.put(`api/v2/task/${taskId}`, { json: body }).json<TaskGetResponse>()
  },

  useUpdateTask: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async ({ taskId, body }: { taskId: number; body: TaskGetResponse }) => {
        const cached = queryClient.getQueryData<TaskGetResponse>(['task', taskId])
        const updatedTask = await taskSingle.updateTask(taskId, body)
        return { updatedTask, oldStatus: cached?.status ?? null, cached }
      },
      onSuccess: ({ updatedTask, oldStatus, cached }, { taskId }) => {
        queryClient.setQueryData<TaskGetResponse>(['task', taskId], {
          ...updatedTask,
          lockedBy: cached?.lockedBy,
          lockBundledTasks: cached?.lockBundledTasks,
        })
        queryClient.invalidateQueries({ queryKey: ['task', 'history', taskId] })
        if (updatedTask?.parent) {
          patchChallengeTaskMarker(queryClient, updatedTask.parent, taskId, {
            status: updatedTask.status ?? undefined,
            priority: updatedTask.priority,
          })
          if (updatedTask.status !== oldStatus) {
            invalidateChallengeAggregates(queryClient, updatedTask.parent)
          }
        }
      },
    })
  },

  /**
   * Set a task's status. `completionResponses` holds the mapper's answers to
   * the form fields in the challenge's instructions; the backend stores them on
   * the task.
   */
  useUpdateTaskStatus: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async ({
        taskId,
        status,
        options,
      }: {
        taskId: number
        status: number
        options?: {
          completionResponses?: Record<string, unknown>
          /** Opaque query params contributed by plugins */
          queryParams?: Record<string, string | boolean | number | undefined | null>
        }
      }) => {
        const searchParams: Record<string, string> = {}
        for (const [key, value] of Object.entries(options?.queryParams ?? {})) {
          if (value !== undefined && value !== null) searchParams[key] = String(value)
        }

        const response = await apiRequest.put(`api/v2/task/${taskId}/${status}`, {
          searchParams,
          ...(options?.completionResponses ? { json: options.completionResponses } : {}),
        })

        // Handle case where response might be empty (204 No Content)
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          return response.json<TaskGetResponse>()
        }

        // If no JSON response, fetch the updated task
        return apiRequest
          .get(`api/v2/task/${taskId}`, { searchParams: { mapillary: false } })
          .json<TaskGetResponse>()
      },
      onSuccess: (updatedTask, variables) => {
        const oldCached = queryClient.getQueryData<TaskGetResponse>(['task', variables.taskId])
        queryClient.setQueryData<TaskGetResponse>(['task', variables.taskId], updatedTask)
        queryClient.invalidateQueries({ queryKey: ['task', 'history', variables.taskId] })
        invalidateLockedTasks(queryClient)
        // The backend awards score and achievements on status change, and
        // reports them nowhere in the response, so refresh the current user.
        queryClient.invalidateQueries({ queryKey: userKeys.whoami })
        if (updatedTask?.parent) {
          patchChallengeTaskMarker(queryClient, updatedTask.parent, variables.taskId, {
            status: variables.status,
          })
          if (oldCached?.status !== variables.status) {
            invalidateChallengeAggregates(queryClient, updatedTask.parent)
          }
        }
      },
    })
  },
}
