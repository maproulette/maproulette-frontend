import { useQueryClient } from '@tanstack/react-query'
import { Flag, Map as MapIcon, Play } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { ChallengePausedNotice } from '@/components/shared/ChallengePausedNotice'
import { Button } from '@/components/ui/Button'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { useMapToggle } from '../MapToggleContext'
import { ChallengeProgress } from './ChallengeProgress'

export const ChallengeFooter = () => {
  const queryClient = useQueryClient()
  const navigateToTask = useNavigateToTask()
  const { challenge, existingIssue } = useBrowsedChallengeContext()
  const { showMap, setShowMap } = useMapToggle()
  const { t } = useIntl()

  const [isLoadingTask, setIsLoadingTask] = useState(false)

  const handleStartTask = async () => {
    if (!challenge.id) return

    try {
      setIsLoadingTask(true)
      const task = await api.challenge.getRandomTask(challenge.id, queryClient)

      if (task && task.length > 0) {
        await navigateToTask(task[0].id)
      } else {
        toast.error(
          t(
            'browsedChallengePage.footer.noTasksAvailable',
            undefined,
            'No tasks available for this challenge'
          )
        )
      }
    } catch (error) {
      logger.error('Error starting task', { error })
      toast.error(
        t('browsedChallengePage.footer.failedToLoadTask', undefined, 'Failed to load task')
      )
    } finally {
      setIsLoadingTask(false)
    }
  }

  return (
    <div className="shrink-0 rounded-b-xl border-zinc-200/50 border-t bg-white px-6 py-6 dark:border-slate-700/50 dark:bg-slate-800">
      <ChallengeProgress />

      {existingIssue && (
        <div className="mt-3 flex justify-center">
          <Button
            variant="outline"
            className="group h-auto gap-2 border-red-200 bg-red-50/50 px-3 py-2 hover:bg-red-100 hover:shadow-sm dark:border-red-800 dark:bg-red-900/10 dark:hover:bg-red-900/20"
            onClick={() => window.open(existingIssue.html_url, '_blank')}
            aria-label={t(
              'browsedChallengePage.footer.viewReportedIssue',
              undefined,
              'View reported issue on GitHub'
            )}
          >
            <Flag className="size-3.5 flex-shrink-0 fill-red-600 text-red-600 drop-shadow-[0_0_4px_rgba(220,38,38,0.6)] transition-all group-hover:drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] dark:fill-red-500 dark:text-red-500 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.6)] dark:group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <p className="text-center text-red-600 text-xs dark:text-red-400">
              {t(
                'browsedChallengePage.footer.reportedIssueMessage',
                undefined,
                'This challenge has been reported. Click here to view the issue.'
              )}
            </p>
            <Flag className="size-3.5 flex-shrink-0 fill-red-600 text-red-600 drop-shadow-[0_0_4px_rgba(220,38,38,0.6)] transition-all group-hover:drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] dark:fill-red-500 dark:text-red-500 dark:drop-shadow-[0_0_4px_rgba(239,68,68,0.6)] dark:group-hover:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
          </Button>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-4">
        {challenge.paused ? (
          <ChallengePausedNotice
            message={t(
              'browsedChallengePage.footer.challengePausedMessage',
              undefined,
              'This challenge is currently paused. New tasks cannot be started until it is resumed.'
            )}
          />
        ) : (
          <Button
            size="lg"
            className="w-full gap-2 rounded-full bg-teal-600 text-white shadow-md transition-all hover:bg-teal-700 hover:shadow-md"
            onClick={handleStartTask}
            disabled={isLoadingTask}
          >
            <Play className="size-5" />
            {isLoadingTask
              ? t('common.loading2', undefined, 'Loading...')
              : t('browsedChallengePage.footer.startChallenge', undefined, 'Start Challenge')}
          </Button>
        )}
      </div>
      <div className="mt-6 md:hidden">
        <Button
          onClick={() => setShowMap(!showMap)}
          variant="outline"
          size="lg"
          className="w-full gap-2 rounded-full transition-all hover:bg-zinc-100 dark:hover:bg-slate-800"
        >
          <MapIcon className="size-5" />
          {showMap
            ? t('browsedChallengePage.footer.hideMap', undefined, 'Hide Map')
            : t('browsedChallengePage.footer.showMap', undefined, 'Show Map')}
        </Button>
      </div>
    </div>
  )
}
