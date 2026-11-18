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
    challenge.completionMetrics
  )
  const { t } = useIntl()

  if (!hasActions) return null

  return (
    <div className="mb-4 flex flex-col gap-3 md:mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-fg">
            {t({ id: 'browsedChallengePage.progress.progress', defaultMessage: 'Progress' })}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 rounded-full px-2.5 text-xs hover:bg-muted-strong"
            onClick={onViewDetails}
          >
            <BarChart3 className="size-3.5" />
            {t({ id: 'browsedChallengePage.progress.details', defaultMessage: 'Details' })}
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold text-base text-fg">{completionPercentage}%</span>
        </div>
      </div>
      <ProgressBar
        segments={segments.length > 0 ? segments : undefined}
        percentage={segments.length > 0 ? undefined : completionPercentage}
      />
    </div>
  )
}
