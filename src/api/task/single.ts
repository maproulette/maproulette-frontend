import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invalidateChallengeAggregates, patchChallengeTaskMarker } from '@/api/challenge/single'
import { logger } from '@/lib/logger'
import type { TaskGetResponse, TaskStartResponse } from '@/types/Task'
import type { UserWhoamiResponse } from '@/types/User'
import { apiRequest } from '../client'

const getCurrentUserId = (queryClient: ReturnType<typeof useQueryClient>): number | null => {
  const me = queryClient.getQueryData<UserWhoamiResponse>(['user', 'whoami'])
  return (me as { id?: number } | undefined)?.id ?? null
}

/**
 * Refresh the current user's "locked tasks" list (e.g. the dashboard block). Called whenever
 * their lock state changes - lock, unlock, or a status change that releases the lock - so the
 * list reflects reality without waiting for the 60s stale window.
 */
export const invalidateLockedTasks = (queryClient: ReturnType<typeof useQueryClient>): void => {
  const userId = getCurrentUserId(queryClient)
  if (userId != null) {
    queryClient.invalidateQueries({ queryKey: ['user', userId, 'lockedTasks'] })
  }
}

export interface TaskSearchResult {
  id: number
  name: string
  status: number | null
  parent: number
  challengeName: string
}

export const taskSingle = {
  searchTasks: ({ q, limit = 25 }: { q: string; limit?: number }) =>
    useQuery(
      queryOptions({
        queryKey: ['task', 'search', { q, limit }],
        queryFn: () =>
          apiRequest
            .get('api/v2/tasks/search', {
              searchParams: { q, limit },
            })
            .json<TaskSearchResult[]>(),
        enabled: q.length > 0,
      })
    ),

  startTask: (taskId: number) =>
    useQuery(
      queryOptions({
        queryKey: ['task', taskId, 'start'],
        queryFn: () => apiRequest.get(`api/v2/task/${taskId}/start`).json<TaskStartResponse>(),
        enabled: !!taskId,
      })
    ),

  getTaskOptions: (taskId: number) =>
    queryOptions({
      queryKey: ['task', taskId],
      queryFn: () =>
        apiRequest.get(`api/v2/task/${taskId}?mapillary=false`).json<TaskGetResponse>(),
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
        queryClient.setQueryData<TaskGetResponse>(['task', taskId], lockedTask)
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

  useUnlockTask: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (taskId: number) =>
        apiRequest.get(`api/v2/task/${taskId}/release`).json<TaskGetResponse>(),
      onSuccess: (unlockedTask, taskId) => {
        queryClient.setQueryData<TaskGetResponse>(['task', taskId], unlockedTask)
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
          .json<{ lockPrimaryTaskId: number; lockBundledTasks: number[] }>()
      },
      onError: (error, variables) => {
        logger.error('Failed to update bundle lock', { error, variables })
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['task', 'inBounds'] })
        invalidateLockedTasks(queryClient)
      },
    })
  },

  useSkipTask: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async (taskId: number) => {
        const cached = queryClient.getQueryData<TaskGetResponse>(['task', taskId])
        await apiRequest.post(`api/v2/task/${taskId}/skip`).text()
        return { taskId, oldStatus: cached?.status ?? null, parent: cached?.parent }
      },
      onSuccess: ({ taskId, oldStatus, parent }) => {
        // Skip sets status to 3 (Skipped); patch the cached task instead of refetching.
        const cached = queryClient.getQueryData<TaskGetResponse>(['task', taskId])
        if (cached) {
          queryClient.setQueryData<TaskGetResponse>(['task', taskId], { ...cached, status: 3 })
        }
        queryClient.invalidateQueries({ queryKey: ['task', 'history', taskId] })
        invalidateLockedTasks(queryClient)
        if (parent) {
          patchChallengeTaskMarker(queryClient, parent, taskId, { status: 3 })
          if (oldStatus !== 3) {
            invalidateChallengeAggregates(queryClient, parent)
          }
        }
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
        return { updatedTask, oldStatus: cached?.status ?? null }
      },
      onSuccess: ({ updatedTask, oldStatus }, { taskId }) => {
        queryClient.setQueryData<TaskGetResponse>(['task', taskId], updatedTask)
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
          tags?: string[]
          comment?: string
          /** Opaque query params contributed by plugins */
          queryParams?: Record<string, string | boolean | number | undefined | null>
        }
      }) => {
        // Build query string manually
        const params = new URLSearchParams()
        if (options?.tags && options.tags.length > 0) {
          params.set('tags', options.tags.join(','))
        }
        if (options?.queryParams) {
          for (const [key, value] of Object.entries(options.queryParams)) {
            if (value !== undefined && value !== null) {
              params.set(key, String(value))
            }
          }
        }

        const queryString = params.toString()
        const url = `api/v2/task/${taskId}/${status}${queryString ? `?${queryString}` : ''}`

        const response = await apiRequest.put(url)

        // If comment is provided, add it separately. The status change above has
        // already succeeded on the server, so a failure here must not fail the
        // whole mutation (which would prevent onSuccess from updating caches).
        if (options?.comment) {
          try {
            await apiRequest
              .post(`api/v2/task/${taskId}/comment`, {
                json: {
                  comment: options.comment,
                },
              })
              .json()
          } catch (error) {
            logger.error('Failed to add comment after task status update', {
              taskId,
              status,
              error,
            })
          }
        }

        // Handle case where response might be empty (204 No Content)
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          return response.json<TaskGetResponse>()
        }

        // If no JSON response, fetch the updated task
        return apiRequest.get(`api/v2/task/${taskId}?mapillary=false`).json<TaskGetResponse>()
      },
      onSuccess: (updatedTask, variables) => {
        const oldCached = queryClient.getQueryData<TaskGetResponse>(['task', variables.taskId])
        queryClient.setQueryData<TaskGetResponse>(['task', variables.taskId], updatedTask)
        queryClient.invalidateQueries({ queryKey: ['task', 'history', variables.taskId] })
        invalidateLockedTasks(queryClient)
        if (variables.options?.comment) {
          queryClient.invalidateQueries({ queryKey: ['task', 'comments', variables.taskId] })
        }
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
