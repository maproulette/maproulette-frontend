import { BarChart3 } from 'lucide-react'
import { useChallengeModals } from '@/components/Pages/BrowsedChallengePage/ChallengePanel/ChallengeModals/ChallengeModalsContext'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { Button } from '@/components/ui/Button'
import { useChallengeProgress } from '@/hooks/useChallengeProgress'
import { useIntl } from '@/i18n'

export const ChallengeProgress = () => {
  const { challenge } = useBrowsedChallengeContext()
  const { openActions: onViewDetails } = useChallengeModals()
  const { completionPercentage, segments, hasActions } = useChallengeProgress(
    challenge.id ?? 0,
    challenge.completionMetrics
  )
  const { t } = useIntl()

  if (!hasActions) return null

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
          <span className="font-semibold text-zinc-900 dark:text-white">
            {t('browsedChallengePage.progress.progress', undefined, 'Progress')}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 rounded-full px-2.5 text-xs hover:bg-zinc-100 dark:hover:bg-slate-700"
            onClick={onViewDetails}
          >
            <BarChart3 className="size-3.5" />
            {t('browsedChallengePage.progress.details', undefined, 'Details')}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-base text-zinc-900 dark:text-white">
            {completionPercentage}%
          </span>
        </div>
      </div>
      <ProgressBar
        segments={segments.length > 0 ? segments : undefined}
        percentage={segments.length > 0 ? undefined : completionPercentage}
      />
    </div>
  )
}
