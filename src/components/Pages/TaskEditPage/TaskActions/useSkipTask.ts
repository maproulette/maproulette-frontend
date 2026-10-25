import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import type { Task } from '@/types/Task'

/**
 * Skipping the current task and moving on, shared by the skip button and the
 * skip keyboard shortcut.
 */
export const useSkipTask = (task: Task) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const navigateToTask = useNavigateToTask()
  const queryClient = useQueryClient()
  // Only mutateAsync is pulled out: react-query hands back a fresh result
  // object every render, and `skipTask` has to stay referentially stable for
  // the shortcut registration that depends on it.
  const { mutateAsync: skipMutation } = api.task.useSkipTask()
  const [isSkipping, setIsSkipping] = useState(false)

  const skipTask = useCallback(async () => {
    if (isSkipping) return
    setIsSkipping(true)
    try {
      await skipMutation(task.id).catch((error) => {
        logger.warn('Skip endpoint failed, falling back to client-side unlock', { error })
      })

      const randomTasks = await api.challenge.getRandomTask(task.parent)
      if (randomTasks && randomTasks.length > 0) {
        await navigateToTask(randomTasks[0].id)
      } else {
        toast.info(
          t('common.noMoreTasksInChallenge', undefined, 'No more tasks available in this challenge')
        )
        await navigate({
          to: '/challenge/$challengeId',
          params: { challengeId: String(task.parent) },
        })
      }
    } catch (error) {
      logger.error('Skip failed', { error })
      toast.error(
        t('taskEditPage.taskActions.skipButton.skipFailed', undefined, 'Could not skip this task')
      )
    } finally {
      setIsSkipping(false)
    }
  }, [isSkipping, skipMutation, task.id, task.parent, queryClient, navigateToTask, navigate, t])

  return { skipTask, isSkipping }
}
