import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Task } from '@/types/Task'
import { apiRequest } from '../client'
import { invalidateLockedTasks } from '../task/single'

export interface TaskBundleResponse {
  bundleId: number
  ownerId: number
  taskIds: number[]
  tasks?: Task[]
}

export interface CreateTaskBundleRequest {
  name: string
  taskIds: number[]
  primaryId?: number
}

export const taskBundleQueries = {
  getTaskBundle: (bundleId: number, lockTasks = false) => {
    const queryClient = useQueryClient()
    return useQuery(
      queryOptions({
        queryKey: ['taskBundle', bundleId, { lockTasks }],
        queryFn: async () => {
          const bundle = await apiRequest
            .post(`api/v2/taskBundle/${bundleId}`, {
              searchParams: { lockTasks: lockTasks.toString() },
            })
            .json<TaskBundleResponse>()
          if (bundle.tasks) {
            for (const task of bundle.tasks) {
              queryClient.setQueryData(['task', task.id], task)
            }
          }
          return bundle
        },
        enabled: !!bundleId,
      })
    )
  },

  useCreateTaskBundle: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (data: CreateTaskBundleRequest) =>
        apiRequest
          .post('api/v2/taskBundle', {
            json: data,
          })
          .json<TaskBundleResponse>(),
      onSuccess: (bundle) => {
        queryClient.setQueryData(['taskBundle', bundle.bundleId, { lockTasks: false }], bundle)
        if (bundle.tasks) {
          for (const task of bundle.tasks) {
            queryClient.setQueryData(['task', task.id], task)
          }
        }

        queryClient.invalidateQueries({ queryKey: ['task', 'inBounds'] })
        invalidateLockedTasks(queryClient)
      },
    })
  },

  useUpdateTaskBundle: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ bundleId, taskIds }: { bundleId: number; taskIds: number[] }) =>
        apiRequest
          .post(`api/v2/taskBundle/${bundleId}/update`, {
            searchParams: { taskIds: taskIds.join(',') },
          })
          .json<TaskBundleResponse>(),
      onSuccess: (updatedBundle, variables) => {
        queryClient.setQueryData(
          ['taskBundle', variables.bundleId, { lockTasks: false }],
          updatedBundle
        )
        if (updatedBundle.tasks) {
          for (const task of updatedBundle.tasks) {
            queryClient.setQueryData(['task', task.id], task)
          }
        }

        queryClient.invalidateQueries({ queryKey: ['task', 'inBounds'] })
        invalidateLockedTasks(queryClient)
      },
    })
  },

  useDeleteTaskBundle: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (bundleId: number) => apiRequest.delete(`api/v2/taskBundle/${bundleId}`).json(),
      onSuccess: (_data, bundleId) => {
        queryClient.removeQueries({ queryKey: ['taskBundle', bundleId] })

        queryClient.invalidateQueries({ queryKey: ['task', 'inBounds'] })
      },
    })
  },

  useUpdateTaskBundleStatus: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async ({
        bundleId,
        primaryId,
        status,
        tags,
        queryParams,
      }: {
        bundleId: number
        primaryId: number
        status: number
        tags?: string[]
        /** Opaque query params contributed by plugins */
        queryParams?: Record<string, string | boolean | number | undefined | null>
      }) => {
        const searchParams: Record<string, string> = { primaryId: String(primaryId) }
        if (tags && tags.length > 0) {
          searchParams.tags = tags.join(',')
        }
        if (queryParams) {
          for (const [key, value] of Object.entries(queryParams)) {
            if (value !== undefined && value !== null) {
              searchParams[key] = String(value)
            }
          }
        }
        await apiRequest.put(`api/v2/taskBundle/${bundleId}/${status}`, { searchParams })
      },
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries({ queryKey: ['taskBundle', variables.bundleId] })
        queryClient.invalidateQueries({ queryKey: ['task'] })
        queryClient.invalidateQueries({ queryKey: ['challenge'] })
        invalidateLockedTasks(queryClient)
      },
    })
  },
}
