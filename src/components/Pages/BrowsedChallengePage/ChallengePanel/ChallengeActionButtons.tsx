import { Link } from '@tanstack/react-router'
import { Code, Copy, Flag, MoreVertical, Settings } from 'lucide-react'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { useChallengeModals } from './ChallengeModals/ChallengeModalsContext'

export const ChallengeActionButtons = () => {
  const { challenge, hasOverpass, canClone, canManage, user, openReport } =
    useBrowsedChallengeContext()
  const { openReport: openReportModal, openOverpass, openClone } = useChallengeModals()
  const { t } = useIntl()

  // A report the user has already filed is still awaiting review; there is
  // nowhere to send them and nothing more for them to do, so the item stays
  // disabled and explains itself.
  const isReportDisabled = !user || !!openReport
  const reportTitle = !user
    ? t(
        'browsedChallengePage.actionButtons.mustLoginToReport',
        undefined,
        'You must be logged in to report a challenge'
      )
    : openReport
      ? t(
          'browsedChallengePage.actionButtons.alreadyReported',
          undefined,
          'You have already reported this challenge; it is awaiting review'
        )
      : t('browsedChallengePage.actionButtons.reportChallengeTitle', undefined, 'Report challenge')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex items-center justify-center rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:text-slate-400 dark:focus:ring-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
          aria-label={t(
            'browsedChallengePage.actionButtons.challengeActions',
            undefined,
            'Challenge actions'
          )}
        >
          <MoreVertical className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {hasOverpass && (
          <DropdownMenuItem onClick={openOverpass}>
            <Code className="size-4" />
            {t('common.overpassQuery', undefined, 'Overpass Query')}
          </DropdownMenuItem>
        )}
        {canManage && challenge.id != null && (
          <DropdownMenuItem asChild>
            <Link
              to="/manage/challenge/$challengeId"
              params={{ challengeId: String(challenge.id) }}
              className="flex cursor-pointer items-center gap-2"
            >
              <Settings className="size-4" />
              {t(
                'browsedChallengePage.actionButtons.manageChallenge',
                undefined,
                'Manage Challenge'
              )}
            </Link>
          </DropdownMenuItem>
        )}
        {canClone && (
          <DropdownMenuItem onClick={openClone}>
            <Copy className="size-4" />
            {t('common.cloneChallenge', undefined, 'Clone Challenge')}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={openReportModal}
          disabled={isReportDisabled}
          title={reportTitle}
          className={openReport ? 'data-[disabled]:opacity-100' : ''}
        >
          <Flag
            className={cn(
              'size-4 transition-all',
              openReport &&
                'fill-red-600 text-red-600 drop-shadow-[0_0_8px_rgba(220,38,38,0.8)] dark:fill-red-500 dark:text-red-500 dark:drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
            )}
          />
          {openReport
            ? t(
                'browsedChallengePage.actionButtons.challengeReported',
                undefined,
                'Challenge Reported'
              )
            : t('common.reportChallenge', undefined, 'Report Challenge')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
