import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, MapPin, Shuffle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { Button } from '@/components/ui/Button'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'
import { useIntl } from '@/i18n'

export const StartMappingActions = ({ challengeId }: { challengeId: number }) => {
  const { t } = useIntl()
  const { isLocking, lockTask } = useTaskContext()
  const navigate = useNavigate()
  const navigateToTask = useNavigateToTask()
  const queryClient = useQueryClient()
  const [isLoadingNext, setIsLoadingNext] = useState(false)

  const handleGoToDifferentTask = async () => {
    setIsLoadingNext(true)
    try {
      const randomTasks = await api.challenge.getRandomTask(challengeId, queryClient)
      if (randomTasks && randomTasks.length > 0) {
        await navigateToTask(randomTasks[0].id)
      } else {
        toast.info(
          t('common.noMoreTasksInChallenge', undefined, 'No more tasks available in this challenge')
        )
        await navigate({
          to: '/challenge/$challengeId',
          params: { challengeId: String(challengeId) },
        })
      }
    } catch {
      toast.error(t('common.failedToLoadNextTask', undefined, 'Failed to load next task'))
    } finally {
      setIsLoadingNext(false)
    }
  }

  return (
    <div className="rounded-lg bg-zinc-100 p-1.5 dark:bg-slate-800/60">
      <div className="grid grid-cols-2 gap-1.5">
        <Button variant="success" size="lg" onClick={lockTask} disabled={isLocking}>
          {isLocking ? <Loader2 className="animate-spin" /> : <MapPin />}
          {isLocking
            ? t('taskEditPage.taskActions.startMapping.starting', undefined, 'Starting...')
            : t('taskEditPage.taskActions.startMapping.mapThisTask', undefined, 'Map this task')}
        </Button>
        <Button
          variant="secondary"
          size="lg"
          onClick={handleGoToDifferentTask}
          disabled={isLoadingNext}
        >
          {isLoadingNext ? <Loader2 className="animate-spin" /> : <Shuffle />}
          {isLoadingNext
            ? t('common.loading2', undefined, 'Loading...')
            : t('taskEditPage.taskActions.startMapping.differentTask', undefined, 'Different task')}
        </Button>
      </div>
    </div>
  )
}
