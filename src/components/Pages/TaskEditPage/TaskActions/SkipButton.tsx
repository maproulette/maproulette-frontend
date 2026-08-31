import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, SkipForward } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/Button'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import type { Task } from '@/types/Task'

export const SkipButton = ({ task }: { task: Task }) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const navigateToTask = useNavigateToTask()
  const queryClient = useQueryClient()
  const skip = api.task.useSkipTask()
  const [busy, setBusy] = useState(false)

  const handleSkip = async () => {
    if (busy) return
    setBusy(true)
    try {
      await skip.mutateAsync(task.id).catch((error) => {
        logger.warn('Skip endpoint failed, falling back to client-side unlock', { error })
      })

      const randomTasks = await api.challenge.getRandomTask(task.parent, queryClient)
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
      setBusy(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSkip}
      disabled={busy}
      className="gap-1.5 rounded-full border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
      title={t(
        'taskEditPage.taskActions.skipButton.title',
        undefined,
        'Skip this task (preserves status)'
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
      ) : (
        <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {t('taskEditPage.taskActions.skipButton.label', undefined, 'Skip this task')}
    </Button>
  )
}
