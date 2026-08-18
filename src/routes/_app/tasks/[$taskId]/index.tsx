import { createFileRoute, notFound } from '@tanstack/react-router'
import { HTTPError } from 'ky'
import { z } from 'zod'
import { api } from '@/api'
import { Task } from '@/components/Pages/TaskEditPage'
import { logger } from '@/lib/logger'

const taskSearchSchema = z.object({
  tab: z.enum(['task', 'properties', 'comments', 'osm']).optional(),
  claimTask: z.coerce.boolean().optional(),
})

export const Route = createFileRoute('/_app/tasks/$taskId/')({
  validateSearch: taskSearchSchema,
  staticData: { pageTitle: 'Task' },
  loader: async ({ params: { taskId }, context: { queryClient } }) => {
    try {
      const task = await queryClient.ensureQueryData(api.task.getTaskOptions(Number(taskId)))
      const challenge = await queryClient.ensureQueryData(
        api.challenge.getChallengeOptions(task.parent)
      )
      return { task, challenge }
    } catch (error) {
      if (error instanceof HTTPError && error.response.status === 404) {
        logger.error('Task or challenge not found', { taskId, error })
        throw notFound()
      }
      throw error
    }
  },
  head: ({ loaderData }) => {
    const task = loaderData?.task

    return {
      meta: [
        {
          title: task?.name ? `Task: ${task.name}` : 'Loading task',
        },
      ],
    }
  },
  component: Task,
})
