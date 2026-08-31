import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiRequest } from '../client'

export interface BulkDeleteResult {
  requested: number
  deleted: number
  denied: number[]
}

export interface BulkReassignResult {
  requested: number
  updated: number
}

export const taskBulk = {
  useBulkUpdateStatus: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async ({ taskIds, status }: { taskIds: number[]; status: number }) => {
        await Promise.all(
          taskIds.map((taskId) => apiRequest.put(`api/v2/task/${taskId}/${status}`).text())
        )
        return { taskIds }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['task'] })
        queryClient.invalidateQueries({ queryKey: ['challenge'] })
      },
    })
  },

  useBulkAddTags: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: async ({ taskIds, tags }: { taskIds: number[]; tags: string[] }) => {
        const joined = tags.join(',')
        await Promise.all(
          taskIds.map((taskId) =>
            apiRequest.get(`api/v2/task/${taskId}/tags/update`, {
              searchParams: { tags: joined },
            })
          )
        )
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['task'] })
        queryClient.invalidateQueries({ queryKey: ['challenge'] })
      },
    })
  },

  useBulkDelete: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (taskIds: number[]) =>
        apiRequest.delete('api/v2/tasks', { json: { taskIds } }).json<BulkDeleteResult>(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['task'] })
        queryClient.invalidateQueries({ queryKey: ['challenge'] })
      },
    })
  },

  useBulkArchive: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ taskIds, archived }: { taskIds: number[]; archived: boolean }) =>
        apiRequest.put('api/v2/tasks/archive', { json: { taskIds, archived } }).text(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['task'] })
        queryClient.invalidateQueries({ queryKey: ['challenge'] })
      },
    })
  },

  useBulkReassign: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: ({ taskIds, userId }: { taskIds: number[]; userId: number }) =>
        apiRequest
          .put('api/v2/tasks/reassign', { json: { taskIds, userId } })
          .json<BulkReassignResult>(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['task'] })
        queryClient.invalidateQueries({ queryKey: ['challenge'] })
      },
    })
  },

  useBulkClearLock: () => {
    const queryClient = useQueryClient()
    return useMutation({
      mutationFn: (taskIds: number[]) =>
        apiRequest.post('api/v2/task/bundle/unlock', { json: taskIds }).json<unknown>(),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['task'] })
        queryClient.invalidateQueries({ queryKey: ['challenge'] })
      },
    })
  },
}
