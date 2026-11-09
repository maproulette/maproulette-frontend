import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { TaskGetResponse } from '@/types/Task'
import { apiRequest } from '../client'

export interface BulkDeleteResult {
  requested: number
  deleted: number
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
        const tasks = await Promise.all(
          taskIds.map((taskId) => apiRequest.get(`api/v2/task/${taskId}`).json<TaskGetResponse>())
        )
        const updatedTasks = tasks.map((task) => ({
          ...task,
          id: String(task.id),
          name: task.name || (task as { title?: string }).title,
          status,
          mappedOn: null,
          reviewStatus: null,
          reviewRequestedBy: null,
          reviewedBy: null,
          reviewedAt: null,
        }))
        await apiRequest.put('api/v2/tasks', { json: updatedTasks }).text()
        return { taskIds }
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
}
