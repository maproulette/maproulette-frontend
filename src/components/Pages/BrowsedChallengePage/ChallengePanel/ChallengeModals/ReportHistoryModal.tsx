import { Flag } from 'lucide-react'
import { defineMessages } from 'react-intl'
import { api } from '@/api'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { MarkdownContent } from '@/components/shared/MarkdownContent'
import { OsmUserLink } from '@/components/shared/OsmUserLink'
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
import type { ChallengeReport, ChallengeReportStatusName } from '@/types/ChallengeReport'
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

const REPORT_STATUS_MESSAGES = defineMessages({
  open: {
    id: 'browsedChallengePage.challengeModals.reportHistory.status.open',
    defaultMessage: 'Open',
  },
  actioned: {
    id: 'browsedChallengePage.challengeModals.reportHistory.status.actioned',
    defaultMessage: 'Actioned',
  },
  dismissed: {
    id: 'browsedChallengePage.challengeModals.reportHistory.status.dismissed',
    defaultMessage: 'Dismissed',
  },
})

/**
 * One report. Resolved ones arrive without the reviewer's name or triage note
 * -- those belong to the admin queue -- so the outcome and its date are all
 * there is to show alongside what the reporter wrote.
 */
const ReportEntry = ({ report }: { report: ChallengeReport }) => {
  const { t, locale } = useIntl()
  const { user } = useAuthContext()
  const isOwnReport = !!user && report.reporterId === user.id

  const statusMessage = REPORT_STATUS_MESSAGES[report.statusName as ChallengeReportStatusName]
  const statusLabel = statusMessage ? t(statusMessage) : report.statusName

  return (
    <li className="space-y-2 rounded-lg border border-line p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-fg-muted text-xs">
          {t(
            {
              id: 'browsedChallengePage.challengeModals.reportHistory.reportedBy',
              defaultMessage: 'Reported by <link>{user}</link> on {date}',
            },
            {
              user: isOwnReport
                ? t({
                    id: 'browsedChallengePage.challengeModals.reportHistory.you',
                    defaultMessage: 'you',
                  })
                : (report.reporterName ?? t({ id: 'common.unknown', defaultMessage: 'Unknown' })),
              link: (chunks) =>
                !isOwnReport && report.reporterName ? (
                  <OsmUserLink username={report.reporterName} className="hover:underline">
                    {chunks}
                  </OsmUserLink>
                ) : (
                  chunks
                ),
              date: formatDateTime(new Date(report.reportedAt), locale),
            }
          )}
        </span>
        <Badge variant={statusBadgeVariant(report.statusName)}>{statusLabel}</Badge>
      </div>

      <MarkdownContent autoLink={false}>{report.comment}</MarkdownContent>

      <p className="text-fg-muted text-xs">
        {report.statusName === 'open'
          ? t({
              id: 'browsedChallengePage.challengeModals.reportHistory.awaitingReview',
              defaultMessage: 'Awaiting review by the MapRoulette administrators.',
            })
          : report.reviewedAt
            ? t(
                {
                  id: 'browsedChallengePage.challengeModals.reportHistory.resolvedOn',
                  defaultMessage: 'Marked {status} on {date}',
                },
                {
                  status: statusLabel.toLowerCase(),
                  date: formatDateTime(new Date(report.reviewedAt), locale),
                }
              )
            : t(
                {
                  id: 'browsedChallengePage.challengeModals.reportHistory.resolved',
                  defaultMessage: 'Marked {status}',
                },
                { status: statusLabel.toLowerCase() }
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
            {t({
              id: 'browsedChallengePage.challengeModals.reportHistory.title',
              defaultMessage: 'Reports on This Challenge',
            })}
          </DialogTitle>
          <DialogDescription>
            {t({
              id: 'browsedChallengePage.challengeModals.reportHistory.description',
              defaultMessage:
                'Reports filed against this challenge and where each one stands. The MapRoulette administrators review every report.',
            })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Loader />
        ) : isError ? (
          <p className="py-6 text-center text-fg-muted text-sm">
            {t({
              id: 'common.reportsLoadError',
              defaultMessage: 'Could not load the reports.',
            })}
          </p>
        ) : reports && reports.length > 0 ? (
          <ul className="max-h-[60vh] space-y-3 overflow-y-auto">
            {reports.map((report) => (
              <ReportEntry key={report.id} report={report} />
            ))}
          </ul>
        ) : (
          <div className="flex flex-col items-center gap-2 py-8">
            <Flag className="size-10 text-line-strong" aria-hidden="true" />
            <p className="text-fg-muted text-sm">
              {t({
                id: 'browsedChallengePage.challengeModals.reportHistory.empty',
                defaultMessage: 'No one has reported this challenge.',
              })}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
