import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Comment } from '@/types/Comment'
import type { TaskGetResponse, TaskHistoryAction } from '@/types/Task'
import { apiRequest } from '../client'
import { taskKeys } from './keys'

export const taskCommentsOptions = (taskId: number) =>
  queryOptions({
    queryKey: ['task', 'comments', taskId],
    queryFn: () => apiRequest.get(`api/v2/task/${taskId}/comments`).json<Comment[]>(),
    enabled: !!taskId,
  })

export const taskHistoryOptions = (taskId: number) =>
  queryOptions({
    queryKey: taskKeys.history(taskId),
    queryFn: () => apiRequest.get(`api/v2/task/${taskId}/history`).json<TaskHistoryAction[]>(),
    enabled: !!taskId,
  })

export const useAddTaskComment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ taskId, commentText }: { taskId: number; commentText: string }) =>
      apiRequest
        .post(`api/v2/task/${taskId}/comment`, {
          json: { comment: commentText },
        })
        .json<Comment>(),
    onSuccess: (newComment, variables) => {
      queryClient.setQueryData<Comment[]>(['task', 'comments', variables.taskId], (oldComments) =>
        oldComments ? [...oldComments, newComment] : [newComment]
      )
      queryClient.invalidateQueries({ queryKey: taskKeys.history(variables.taskId) })
      // Comments don't change task status or markers — only the activity feed
      // shows them, so invalidate just that one cache for the parent challenge.
      const task = queryClient.getQueryData<TaskGetResponse>(taskKeys.task(variables.taskId))
      if (task?.parent) {
        queryClient.invalidateQueries({ queryKey: ['challenge', 'activity', task.parent] })
      }
    },
  })
}

export const useAddTaskBundleComment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      bundleId,
      commentText,
    }: {
      bundleId: number
      primaryTaskId: number
      commentText: string
    }) =>
      apiRequest
        .post(`api/v2/taskBundle/${bundleId}/comment`, {
          json: { comment: commentText },
        })
        .text(),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task', 'comments'] })
      queryClient.invalidateQueries({ queryKey: ['task', 'history'] })
      const task = queryClient.getQueryData<TaskGetResponse>(taskKeys.task(variables.primaryTaskId))
      if (task?.parent) {
        queryClient.invalidateQueries({ queryKey: ['challenge', 'activity', task.parent] })
      }
    },
  })
}
