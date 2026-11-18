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
import { formatDurationMs } from '@/lib/date'
import { useChallengeModals } from './ChallengeModalsContext'

/** Percentages under 1% still deserve to read as "some", not "0%". */
const formatPercent = (percent: number) =>
  percent > 0 && percent < 1 ? '<1%' : `${Math.round(percent)}%`

const MetaRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline justify-between gap-4">
    <span className="text-fg-muted text-sm">{label}</span>
    <span className="font-semibold text-fg text-sm tabular-nums">{value}</span>
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
            {t({
              id: 'browsedChallengePage.challengeModals.actions.title',
              defaultMessage: 'Task Activity',
            })}
          </DialogTitle>
        </DialogHeader>
        {!actions ? (
          <p className="py-6 text-center text-fg-muted text-sm">
            {t({
              id: 'browsedChallengePage.challengeModals.actions.unavailable',
              defaultMessage: 'Task activity is not available for this challenge.',
            })}
          </p>
        ) : (
          <div className="space-y-5">
            <section className="rounded-lg border border-line bg-muted p-4">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-medium text-fg-muted text-xs uppercase tracking-wide">
                    {t({
                      id: 'common.completed',
                      defaultMessage: 'Completed',
                    })}
                  </p>
                  <p className="mt-1.5 font-semibold text-3xl text-fg tabular-nums leading-none tracking-tight">
                    {formatPercent(completedPercent)}
                  </p>
                </div>
                <p className="text-fg-muted text-sm tabular-nums">
                  {t(
                    {
                      id: 'browsedChallengePage.challengeModals.actions.completedOf',
                      defaultMessage:
                        '{total, plural, one {{completed, number} of # task} other {{completed, number} of # tasks}}',
                    },
                    { completed, total }
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
                    className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="size-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <dt className="min-w-0 flex-1 truncate text-fg text-sm">{segment.label}</dt>
                    <dd className="font-semibold text-fg text-sm tabular-nums">
                      {formatNumber(segment.count)}
                    </dd>
                    <dd className="w-12 text-right text-fg-muted text-xs tabular-nums">
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
                      label={t({
                        id: 'browsedChallengePage.challengeModals.actions.avgTimeSpent',
                        defaultMessage: 'Average Time Spent',
                      })}
                      value={formatDurationMs(avgTimeSpent, locale)}
                    />
                  )}
                  {validated !== undefined && validated > 0 && (
                    <MetaRow
                      label={t({
                        id: 'common.validated',
                        defaultMessage: 'Validated',
                      })}
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
