import { Eye, Flag, Play } from 'lucide-react'
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
import { useChallengeModals } from './ChallengeModals/ChallengeModalsContext'
import { ChallengeProgress } from './ChallengeProgress'

export const ChallengeFooter = () => {
  const navigateToTask = useNavigateToTask()
  const { challenge, hasOpenReport, user } = useBrowsedChallengeContext()
  const { challengeFooterExtensions } = usePluginContext()
  const { openReportHistory } = useChallengeModals()
  const { t } = useIntl()

  const { hasActions, tasksRemaining } = useChallengeProgress(challenge.completionMetrics)

  const [isLoadingTask, setIsLoadingTask] = useState(false)

  // Nothing left to work on (every task is completed, or the challenge has no
  // tasks at all), so offer read-only browsing instead of a start that can only
  // fail with "no tasks available".
  const isBrowseOnly = hasActions && tasksRemaining === 0

  const handleStartTask = async () => {
    if (!challenge.id) return

    try {
      setIsLoadingTask(true)
      const task = await api.challenge.getRandomTask(challenge.id)

      if (task && task.length > 0) {
        await navigateToTask(task[0].id)
      } else {
        toast.error(
          t({
            id: 'browsedChallengePage.footer.noTasksAvailable',
            defaultMessage: 'No tasks available for this challenge',
          })
        )
      }
    } catch (error) {
      logger.error('Error starting task', { error })
      toast.error(
        t({
          id: 'browsedChallengePage.footer.failedToLoadTask',
          defaultMessage: 'Failed to load task',
        })
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
      const tasks = await api.challenge.getFirstTask(challenge.id)

      if (tasks && tasks.length > 0) {
        await navigateToTask(tasks[0].id, { claim: false })
      } else {
        toast.error(
          t({
            id: 'browsedChallengePage.footer.noTasksToBrowse',
            defaultMessage: 'This challenge has no tasks',
          })
        )
      }
    } catch (error) {
      logger.error('Error browsing challenge', { error })
      toast.error(
        t({
          id: 'browsedChallengePage.footer.failedToLoadTask',
          defaultMessage: 'Failed to load task',
        })
      )
    } finally {
      setIsLoadingTask(false)
    }
  }

  const mapContent = (
    <>
      <div>
        <ChallengeProgress />
        {hasOpenReport && (
          <div className="mt-3">
            <button
              type="button"
              onClick={openReportHistory}
              title={t({
                id: 'browsedChallengePage.footer.reportedIssueTooltip',
                defaultMessage: 'View the reports on this challenge',
              })}
              className="flex w-full items-center justify-center gap-2 rounded-md border border-danger/40 bg-danger/5 px-3 py-2 text-center transition-colors hover:bg-danger/10"
            >
              <Flag className="size-3.5 flex-shrink-0 fill-danger text-danger" />
              <span className="text-danger text-xs underline-offset-2 hover:underline">
                {t({
                  id: 'browsedChallengePage.footer.reportedIssueMessage',
                  defaultMessage: 'This challenge has been reported. Click to view the reports.',
                })}
              </span>
            </button>
          </div>
        )}
        <div className="mt-3 flex flex-col gap-4">
          {challenge.paused && !isBrowseOnly ? (
            <ChallengePausedNotice
              message={t({
                id: 'browsedChallengePage.footer.challengePausedMessage',
                defaultMessage:
                  'This challenge is currently paused. New tasks cannot be started until it is resumed.',
              })}
            />
          ) : (
            <Button
              size="lg"
              variant="success"
              className="w-full gap-2 rounded-full"
              onClick={isBrowseOnly ? handleBrowseTask : handleStartTask}
              disabled={isLoadingTask}
            >
              {isBrowseOnly ? <Eye className="size-5" /> : <Play className="size-5" />}
              {isLoadingTask
                ? t({ id: 'common.loading2', defaultMessage: 'Loading...' })
                : isBrowseOnly
                  ? t({
                      id: 'common.browseChallengeButton',
                      defaultMessage: 'Browse Challenge',
                    })
                  : t({
                      id: 'browsedChallengePage.footer.startChallenge',
                      defaultMessage: 'Start Challenge',
                    })}
            </Button>
          )}
        </div>{' '}
      </div>
    </>
  )
  const FooterExtension = challengeFooterExtensions[0]?.component

  return (
    <div className="shrink-0 border-line-gradient border-t px-4 py-4 md:px-6">
      {FooterExtension ? (
        <FooterExtension challenge={challenge} user={user} mapContent={mapContent} />
      ) : (
        mapContent
      )}
    </div>
  )
}
