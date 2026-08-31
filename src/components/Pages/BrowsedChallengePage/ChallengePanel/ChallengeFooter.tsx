import { useQueryClient } from '@tanstack/react-query'
import { Eye, Flag, Map as MapIcon, Play } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { ChallengePausedNotice } from '@/components/shared/ChallengePausedNotice'
import { Button } from '@/components/ui/Button'
import { usePluginContext } from '@/contexts/PluginContext'
import { useChallengeProgress } from '@/hooks/useChallengeProgress'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { useMapToggle } from '../MapToggleContext'
import { ChallengeProgress } from './ChallengeProgress'

export const ChallengeFooter = () => {
  const queryClient = useQueryClient()
  const navigateToTask = useNavigateToTask()
  const { challenge, existingIssue, user } = useBrowsedChallengeContext()
  const { challengeFooterExtensions } = usePluginContext()
  const { showMap, setShowMap } = useMapToggle()
  const { t } = useIntl()

  const { hasActions, tasksRemaining } = useChallengeProgress(
    challenge.id ?? 0,
    challenge.completionMetrics
  )

  const [isLoadingTask, setIsLoadingTask] = useState(false)

  // Nothing left to work on (every task is completed, or the challenge has no
  // tasks at all), so offer read-only browsing instead of a start that can only
  // fail with "no tasks available".
  const isBrowseOnly = hasActions && tasksRemaining === 0

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

  // Opens a task without claiming it, so completed challenges can still be read through.
  const handleBrowseTask = async () => {
    if (!challenge.id) return

    try {
      setIsLoadingTask(true)
      const tasks = await api.challenge.getFirstTask(challenge.id, queryClient)

      if (tasks && tasks.length > 0) {
        await navigateToTask(tasks[0].id, { claim: false })
      } else {
        toast.error(
          t('browsedChallengePage.footer.noTasksToBrowse', undefined, 'This challenge has no tasks')
        )
      }
    } catch (error) {
      logger.error('Error browsing challenge', { error })
      toast.error(
        t('browsedChallengePage.footer.failedToLoadTask', undefined, 'Failed to load task')
      )
    } finally {
      setIsLoadingTask(false)
    }
  }

  const mapContent = (
    <>
      <div className="shrink-0 rounded-b-lg bg-white dark:bg-slate-800">
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
        <div className="mt-3 flex flex-col gap-4">
          {challenge.paused && !isBrowseOnly ? (
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
              onClick={isBrowseOnly ? handleBrowseTask : handleStartTask}
              disabled={isLoadingTask}
            >
              {isBrowseOnly ? <Eye className="size-5" /> : <Play className="size-5" />}
              {isLoadingTask
                ? t('common.loading2', undefined, 'Loading...')
                : isBrowseOnly
                  ? t('browsedChallengePage.footer.browseChallenge', undefined, 'Browse Challenge')
                  : t('browsedChallengePage.footer.startChallenge', undefined, 'Start Challenge')}
            </Button>
          )}
        </div>{' '}
      </div>
    </>
  )
  const FooterExtension = challengeFooterExtensions[0]?.component

  return (
    <div className="shrink-0 rounded-b-xl border-zinc-200/50 border-t bg-white px-4 py-4 dark:border-slate-700/50 dark:bg-slate-800">
      {FooterExtension ? (
        <FooterExtension challenge={challenge} user={user} mapContent={mapContent} />
      ) : (
        mapContent
      )}
      <div className="mt-4 md:hidden">
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
