import { useQuery } from '@tanstack/react-query'
import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { challengeStatsOptions } from '@/api/challenge'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { ProgressBar } from '@/components/shared/ProgressBar'
import { Button } from '@/components/ui/Button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/Collapsible'
import { useAuthContext } from '@/contexts/AuthContext'
import { type ActionCounts, useActionSummary } from '@/hooks/useActionSummary'
import { useChallengeProgress } from '@/hooks/useChallengeProgress'
import { useIntl } from '@/i18n'
import { formatDurationMs } from '@/lib/date'
import { cn } from '@/lib/utils'

const formatPercent = (percent: number) =>
  percent > 0 && percent < 1 ? '<1%' : `${Math.round(percent)}%`

export const ChallengeProgress = () => {
  const { challenge } = useBrowsedChallengeContext()
  const { isAuthenticated } = useAuthContext()
  const { completionPercentage, segments, hasActions } = useChallengeProgress(
    challenge.completionMetrics
  )
  const { t, locale, formatNumber } = useIntl()
  const [open, setOpen] = useState(false)

  // /api/v2/data/challenge/:id requires auth, so logged-out users get the
  // listing-provided completion metrics instead (which have no timing data).
  const { data: statsData } = useQuery({
    ...challengeStatsOptions(challenge.id),
    enabled: !!challenge.id && isAuthenticated && open,
  })
  const stats = statsData?.[0]?.actions
  const actions: ActionCounts | undefined = stats ?? challenge.completionMetrics
  const summary = useActionSummary(actions)
  const avgTimeSpent = stats?.avgTimeSpent ?? 0
  const validated = actions?.validated ?? 0
  const hasAvgTime = avgTimeSpent > 0
  const hasValidated = validated > 0

  if (!hasActions) return null

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="mb-4 flex flex-col gap-3 md:mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-fg">
            {t({ id: 'browsedChallengePage.progress.progress', defaultMessage: 'Progress' })}
          </span>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 px-2 text-fg-muted text-xs">
              {t({ id: 'browsedChallengePage.progress.details', defaultMessage: 'Details' })}
              <ChevronDown className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <span className="font-bold text-base text-fg">{completionPercentage}%</span>
      </div>
      <ProgressBar
        segments={segments.length > 0 ? segments : undefined}
        percentage={segments.length > 0 ? undefined : completionPercentage}
      />
      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <p className="mb-2 text-fg-muted text-xs tabular-nums">
          {t(
            {
              id: 'browsedChallengePage.progress.completedOf',
              defaultMessage:
                '{total, plural, one {{completed, number} of # task completed} other {{completed, number} of # tasks completed}}',
            },
            { completed: summary.completed, total: summary.total }
          )}
        </p>
        <dl className="flex flex-col gap-1 text-sm">
          {summary.segments.map((segment) => (
            <div key={segment.key} className="flex items-center gap-2.5">
              <span
                aria-hidden="true"
                className={cn(
                  'size-2.5 shrink-0 rounded-full',
                  segment.key === 'available' && 'border border-fg-subtle bg-muted-strong'
                )}
                style={segment.key === 'available' ? {} : { backgroundColor: segment.color }}
              />
              <dt className="min-w-0 flex-1 truncate text-fg">{segment.label}</dt>
              <dd className="font-semibold text-fg tabular-nums">{formatNumber(segment.count)}</dd>
              <dd className="w-10 text-right text-fg-muted text-xs tabular-nums">
                {formatPercent(segment.percent)}
              </dd>
            </div>
          ))}
        </dl>
        {(hasAvgTime || hasValidated) && (
          <dl className="mt-2 flex flex-col gap-1 border-line border-t pt-2 text-sm">
            {hasAvgTime && (
              <div className="flex items-center justify-between gap-2.5">
                <dt className="text-fg-muted">
                  {t({
                    id: 'browsedChallengePage.progress.avgTimeSpent',
                    defaultMessage: 'Average time spent',
                  })}
                </dt>
                <dd className="font-semibold text-fg tabular-nums">
                  {formatDurationMs(avgTimeSpent, locale)}
                </dd>
              </div>
            )}
            {hasValidated && (
              <div className="flex items-center justify-between gap-2.5">
                <dt className="text-fg-muted">
                  {t({ id: 'common.validated', defaultMessage: 'Validated' })}
                </dt>
                <dd className="font-semibold text-fg tabular-nums">{formatNumber(validated)}</dd>
              </div>
            )}
          </dl>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}
