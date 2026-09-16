import { Flag } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { api } from '@/api'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { Badge } from '@/components/ui/Badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { Loader } from '@/components/ui/Loader'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { formatDateTime } from '@/lib/date'
import { markdownRemarkPlugins } from '@/lib/markdown'
import type { ChallengeReport } from '@/types/ChallengeReport'
import { useChallengeModals } from './ChallengeModalsContext'

const statusBadgeVariant = (statusName: string) => {
  switch (statusName) {
    case 'open':
      return 'destructive' as const
    case 'actioned':
      return 'success' as const
    default:
      return 'secondary' as const
  }
}

/**
 * One report. Resolved ones arrive without the reviewer's name or triage note
 * -- those belong to the admin queue -- so the outcome and its date are all
 * there is to show alongside what the reporter wrote.
 */
const ReportEntry = ({ report }: { report: ChallengeReport }) => {
  const { t, locale } = useIntl()
  const { user } = useAuthContext()
  const isOwnReport = !!user && report.reporterId === user.id

  const statusLabel = t(
    `browsedChallengePage.challengeModals.reportHistory.status.${report.statusName}`,
    undefined,
    report.statusName
  )

  return (
    <li className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-slate-700">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-zinc-500 dark:text-slate-400">
          {t(
            'browsedChallengePage.challengeModals.reportHistory.reportedBy',
            {
              user: isOwnReport
                ? t('browsedChallengePage.challengeModals.reportHistory.you', undefined, 'you')
                : (report.reporterName ?? t('common.unknown', undefined, 'Unknown')),
              date: formatDateTime(new Date(report.reportedAt), locale),
            },
            'Reported by {user} on {date}'
          )}
        </span>
        <Badge variant={statusBadgeVariant(report.statusName)}>{statusLabel}</Badge>
      </div>

      <div className="prose prose-sm dark:prose-invert max-w-none break-words text-zinc-700 dark:text-slate-300 [&_a]:text-blue-600 [&_a]:hover:underline dark:[&_a]:text-blue-400">
        <ReactMarkdown
          remarkPlugins={markdownRemarkPlugins}
          components={{
            a: ({ ...props }) => (
              <a
                {...props}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              />
            ),
          }}
        >
          {report.comment}
        </ReactMarkdown>
      </div>

      <p className="text-xs text-zinc-500 dark:text-slate-400">
        {report.statusName === 'open'
          ? t(
              'browsedChallengePage.challengeModals.reportHistory.awaitingReview',
              undefined,
              'Awaiting review by the MapRoulette administrators.'
            )
          : report.reviewedAt
            ? t(
                'browsedChallengePage.challengeModals.reportHistory.resolvedOn',
                {
                  status: statusLabel.toLowerCase(),
                  date: formatDateTime(new Date(report.reviewedAt), locale),
                },
                'Marked {status} on {date}'
              )
            : t(
                'browsedChallengePage.challengeModals.reportHistory.resolved',
                { status: statusLabel.toLowerCase() },
                'Marked {status}'
              )}
      </p>
    </li>
  )
}

/**
 * Every report filed against this challenge, opened from the footer notice that
 * says the challenge has been reported. The reporters are named -- filing a
 * report also posts a challenge comment saying so -- but the admin triage
 * queue itself stays private to super admins.
 */
export const ReportHistoryModal = () => {
  const { t } = useIntl()
  const { challenge } = useBrowsedChallengeContext()
  const { isReportHistoryModalOpen, setReportHistoryOpen } = useChallengeModals()

  // The page already holds this listing -- it is what decides whether the
  // footer notice shows at all -- so opening the dialog reads it from the cache.
  const { data: reports, isLoading, isError } = api.challenge.forChallenge(challenge.id)

  return (
    <Dialog open={isReportHistoryModalOpen} onOpenChange={setReportHistoryOpen}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>
            {t(
              'browsedChallengePage.challengeModals.reportHistory.title',
              undefined,
              'Reports on This Challenge'
            )}
          </DialogTitle>
          <DialogDescription>
            {t(
              'browsedChallengePage.challengeModals.reportHistory.description',
              undefined,
              'Reports filed against this challenge and where each one stands. The MapRoulette administrators review every report.'
            )}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Loader />
        ) : isError ? (
          <p className="py-6 text-center text-sm text-zinc-600 dark:text-slate-400">
            {t(
              'browsedChallengePage.challengeModals.reportHistory.loadError',
              undefined,
              'Could not load the reports.'
            )}
          </p>
        ) : reports && reports.length > 0 ? (
          <ul className="max-h-[60vh] space-y-3 overflow-y-auto">
            {reports.map((report) => (
              <ReportEntry key={report.id} report={report} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8">
            <Flag className="size-10 text-zinc-300 dark:text-slate-700" aria-hidden="true" />
            <p className="text-sm text-zinc-600 dark:text-slate-400">
              {t(
                'browsedChallengePage.challengeModals.reportHistory.empty',
                undefined,
                'No one has reported this challenge.'
              )}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
