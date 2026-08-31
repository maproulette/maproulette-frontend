import { api } from '@/api'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import {
  type ActionCounts,
  StatusBreakdownBar,
  useActionSummary,
} from '@/components/shared/StatusBreakdownBar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog'
import { Separator } from '@/components/ui/Separator'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { formatDurationSeconds } from '@/lib/date'
import { useChallengeModals } from './ChallengeModalsContext'

/** Percentages under 1% still deserve to read as "some", not "0%". */
const formatPercent = (percent: number) =>
  percent > 0 && percent < 1 ? '<1%' : `${Math.round(percent)}%`

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-4">
    <span className="text-sm text-zinc-600 dark:text-slate-400">{label}</span>
    <span className="font-semibold text-sm text-zinc-900 tabular-nums dark:text-white">
      {value}
    </span>
  </div>
)

export const ActionsModal = () => {
  const { t, locale, formatNumber } = useIntl()
  const { challenge } = useBrowsedChallengeContext()
  const { isAuthenticated } = useAuthContext()
  const { isActionsModalOpen, setActionsOpen } = useChallengeModals()

  // /api/v2/data/challenge/:id requires auth, so skip it for logged-out users
  // and fall back to the listing-provided completion metrics instead of a
  // doomed 401 that would leave the dialog with nothing to show.
  const { data: challengeStatsData } = api.challenge.getChallengeStats(
    challenge.id ?? 0,
    isAuthenticated
  )
  const stats = challengeStatsData?.[0]?.actions
  const actions: ActionCounts | undefined = stats ?? challenge.completionMetrics
  // Only the stats endpoint reports timing; the fallback metrics have no equivalent.
  const avgTimeSpent = stats?.avgTimeSpent
  const validated = actions?.validated

  const { total, completed, segments } = useActionSummary(actions)
  const completedPercent = total > 0 ? (completed / total) * 100 : 0

  return (
    <Dialog open={isActionsModalOpen} onOpenChange={setActionsOpen}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {t('browsedChallengePage.challengeModals.actions.title', undefined, 'Task Activity')}
          </DialogTitle>
        </DialogHeader>
        {!actions ? (
          <p className="py-6 text-center text-sm text-zinc-600 dark:text-slate-400">
            {t(
              'browsedChallengePage.challengeModals.actions.unavailable',
              undefined,
              'Task activity is not available for this challenge.'
            )}
          </p>
        ) : (
          <div className="space-y-5">
            <section className="rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-medium text-xs text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
                    {t(
                      'browsedChallengePage.challengeModals.actions.completed',
                      undefined,
                      'Completed'
                    )}
                  </p>
                  <p className="mt-1.5 font-semibold text-3xl text-zinc-900 tabular-nums leading-none tracking-tight dark:text-zinc-50">
                    {formatPercent(completedPercent)}
                  </p>
                </div>
                <p className="text-sm text-zinc-600 tabular-nums dark:text-slate-400">
                  {t(
                    'browsedChallengePage.challengeModals.actions.completedOf',
                    { completed: formatNumber(completed), total: formatNumber(total) },
                    '{completed} of {total} tasks'
                  )}
                </p>
              </div>
              <div className="mt-3">
                <StatusBreakdownBar actions={actions} height={10} />
              </div>
            </section>

            {segments.length > 0 && (
              <dl className="space-y-0.5">
                {segments.map((segment) => (
                  <div
                    key={segment.key}
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-50 dark:hover:bg-slate-800/60"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <dt className="min-w-0 flex-1 truncate text-sm text-zinc-700 dark:text-slate-300">
                      {segment.label}
                    </dt>
                    <dd className="font-semibold text-sm text-zinc-900 tabular-nums dark:text-white">
                      {formatNumber(segment.count)}
                    </dd>
                    <dd className="w-12 text-right text-xs text-zinc-500 tabular-nums dark:text-slate-400">
                      {formatPercent(segment.percent)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {((avgTimeSpent !== undefined && avgTimeSpent > 0) ||
              (validated !== undefined && validated > 0)) && (
              <>
                <Separator />
                <div className="space-y-2 px-2">
                  {avgTimeSpent !== undefined && avgTimeSpent > 0 && (
                    <MetaRow
                      label={t(
                        'browsedChallengePage.challengeModals.actions.avgTimeSpent',
                        undefined,
                        'Average Time Spent'
                      )}
                      value={formatDurationSeconds(avgTimeSpent, locale)}
                    />
                  )}
                  {validated !== undefined && validated > 0 && (
                    <MetaRow
                      label={t(
                        'browsedChallengePage.challengeModals.actions.validated',
                        undefined,
                        'Validated'
                      )}
                      value={formatNumber(validated)}
                    />
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
