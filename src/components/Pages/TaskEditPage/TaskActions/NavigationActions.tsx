import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, Navigation, Shuffle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/Button'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'
import { useIntl } from '@/i18n'

export const NavigationActions = ({
  challengeId,
  taskId,
}: {
  challengeId: number
  taskId: number
}) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const navigateToTask = useNavigateToTask()
  const queryClient = useQueryClient()
  const [isLoadingNearby, setIsLoadingNearby] = useState(false)
  const [isLoadingRandom, setIsLoadingRandom] = useState(false)

  const handleGoToNearbyTask = async () => {
    setIsLoadingNearby(true)
    try {
      const nearbyTasks = await queryClient.fetchQuery({
        queryKey: ['challenge', 'tasksNearby', challengeId, { taskId, limit: 1 }],
        queryFn: () => api.challenge.fetchTasksNearby(challengeId, taskId, 1),
      })
      if (nearbyTasks && nearbyTasks.length > 0) {
        await navigateToTask(nearbyTasks[0].id)
      } else {
        toast.info(
          t(
            'taskEditPage.taskActions.navigation.noNearbyTasks',
            undefined,
            'No nearby tasks available'
          )
        )
      }
    } catch {
      toast.error(
        t(
          'taskEditPage.taskActions.navigation.loadNearbyFailed',
          undefined,
          'Failed to load nearby task'
        )
      )
    } finally {
      setIsLoadingNearby(false)
    }
  }

  const handleGoToRandomTask = async () => {
    setIsLoadingRandom(true)
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
      setIsLoadingRandom(false)
    }
  }

  return (
    <div className="rounded-lg bg-zinc-100 p-2.5 dark:bg-slate-800/60">
      <p className="mb-2 text-center font-medium text-sm text-zinc-700 dark:text-slate-300">
        {t(
          'taskEditPage.taskActions.navigation.wantToMap',
          undefined,
          'Want to map this challenge?'
        )}
      </p>
      <div className="grid grid-cols-2 gap-1.5">
        <Button
          variant="success"
          size="lg"
          onClick={handleGoToNearbyTask}
          disabled={isLoadingNearby}
        >
          {isLoadingNearby ? <Loader2 className="animate-spin" /> : <Navigation />}
          {isLoadingNearby
            ? t('common.loading2', undefined, 'Loading...')
            : t('taskEditPage.taskActions.navigation.nearbyTask', undefined, 'Nearby task')}
        </Button>
        <Button
          variant="success"
          size="lg"
          onClick={handleGoToRandomTask}
          disabled={isLoadingRandom}
        >
          {isLoadingRandom ? <Loader2 className="animate-spin" /> : <Shuffle />}
          {isLoadingRandom
            ? t('common.loading2', undefined, 'Loading...')
            : t('taskEditPage.taskActions.navigation.randomTask', undefined, 'Random task')}
        </Button>
      </div>
    </div>
  )
}
