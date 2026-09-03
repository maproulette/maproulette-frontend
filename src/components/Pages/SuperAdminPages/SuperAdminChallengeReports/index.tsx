import { Link } from '@tanstack/react-router'
import { Ban, Check, Flag } from 'lucide-react'
import { useId, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/Empty'
import { Input } from '@/components/ui/Input'
import { Loader } from '@/components/ui/Loader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useIntl } from '@/i18n'
import { getErrorMessage } from '@/lib/apiError'
import { formatDate } from '@/lib/date'
import { logger } from '@/lib/logger'
import {
  type ChallengeReport,
  type ChallengeReportStatusName,
  isOpenReport,
} from '@/types/ChallengeReport'

const STATUS_FILTERS: ChallengeReportStatusName[] = ['open', 'actioned', 'dismissed']

const statusBadgeVariant = (statusName: string) => {
  switch (statusName) {
    case 'open':
      return 'destructive' as const
    case 'actioned':
      return 'default' as const
    default:
      return 'secondary' as const
  }
}

/**
 * One report, with the triage controls an admin needs: a note recording what
 * was decided, and the two ways a report can be closed out.
 */
const ReportRow = ({ report }: { report: ChallengeReport }) => {
  const { t } = useIntl()
  const [reviewComment, setReviewComment] = useState('')
  const updateStatus = api.challenge.useUpdateReportStatus()
  const busy = updateStatus.isPending

  const decide = async (status: ChallengeReportStatusName) => {
    try {
      await updateStatus.mutateAsync({
        reportId: report.id,
        status,
        reviewComment: reviewComment.trim() || undefined,
      })
      toast.success(
        status === 'actioned'
          ? t('superAdminChallengeReports.actionedSuccess', undefined, 'Report marked actioned')
          : t('superAdminChallengeReports.dismissedSuccess', undefined, 'Report dismissed')
      )
    } catch (error) {
      logger.error('Challenge report triage failed', { status, error: String(error) })
      toast.error(
        await getErrorMessage(
          error,
          t('superAdminChallengeReports.reviewError', undefined, 'Could not record that decision')
        )
      )
    }
  }

  return (
    <li className="space-y-3 rounded-lg border border-zinc-200 p-4 dark:border-slate-700">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-48">
          {report.challengeName ? (
            <Link
              to="/challenge/$challengeId"
              params={{ challengeId: String(report.challengeId) }}
              className="font-medium text-blue-600 text-sm hover:underline dark:text-blue-400"
            >
              #{report.challengeId} — {report.challengeName}
            </Link>
          ) : (
            <p className="font-medium text-sm">#{report.challengeId}</p>
          )}
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            {t(
              'superAdminChallengeReports.reportMeta',
              {
                project: report.projectName ?? String(report.projectId ?? ''),
                user: report.reporterName ?? t('common.unknown', undefined, 'Unknown'),
                date: formatDate(new Date(report.reportedAt)),
              },
              '{project} · reported by {user} on {date}'
            )}
          </p>
          {report.reporterEmail && (
            <p className="text-xs text-zinc-400 dark:text-slate-500">{report.reporterEmail}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {report.challengeIsArchived && (
            <Badge variant="secondary">
              {t('superAdminChallengeReports.archivedBadge', undefined, 'Archived')}
            </Badge>
          )}
          <Badge variant={statusBadgeVariant(report.statusName)}>{report.statusName}</Badge>
        </div>
      </div>

      <p className="whitespace-pre-wrap break-words text-sm text-zinc-700 dark:text-slate-300">
        {report.comment}
      </p>

      {isOpenReport(report) ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={reviewComment}
            onChange={(e) => setReviewComment(e.target.value)}
            placeholder={t(
              'superAdminChallengeReports.commentPlaceholder',
              undefined,
              'Note (optional)'
            )}
            className="w-56"
            aria-label={t('superAdminChallengeReports.commentLabel', undefined, 'Review note')}
          />
          <Button size="sm" onClick={() => decide('actioned')} disabled={busy}>
            <Check className="size-4" aria-hidden="true" />{' '}
            {t('superAdminChallengeReports.markActioned', undefined, 'Mark actioned')}
          </Button>
          <Button size="sm" variant="outline" onClick={() => decide('dismissed')} disabled={busy}>
            <Ban className="size-4" aria-hidden="true" />{' '}
            {t('superAdminChallengeReports.dismiss', undefined, 'Dismiss')}
          </Button>
          <Button size="sm" variant="outline" asChild>
            <Link
              to="/manage/challenge/$challengeId"
              params={{ challengeId: String(report.challengeId) }}
            >
              {t('superAdminChallengeReports.manageChallenge', undefined, 'Manage challenge')}
            </Link>
          </Button>
        </div>
      ) : (
        <p className="text-xs text-zinc-500 dark:text-slate-400">
          {t(
            'superAdminChallengeReports.resolvedMeta',
            {
              status: report.statusName,
              user: report.reviewedByName ?? t('common.unknown', undefined, 'Unknown'),
              date: report.reviewedAt ? formatDate(new Date(report.reviewedAt)) : '',
            },
            '{status} by {user} on {date}'
          )}
          {report.reviewComment ? ` — ${report.reviewComment}` : ''}
        </p>
      )}
    </li>
  )
}

/**
 * The super admin triage queue for challenge reports. Defaults to open reports
 * on challenges that are still active, which is the set an admin can actually
 * do something about.
 */
export const SuperAdminChallengeReports = () => {
  const { t } = useIntl()
  const activeOnlyId = useId()
  const [status, setStatus] = useState<ChallengeReportStatusName>('open')
  const [activeOnly, setActiveOnly] = useState(true)

  const { data: reports, isLoading, isError } = api.challenge.reports({ status, activeOnly })

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4">
      <div>
        <h1 className="font-bold text-xl text-zinc-900 dark:text-zinc-50">
          {t('superAdminChallengeReports.title', undefined, 'Challenge reports')}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t(
            'superAdminChallengeReports.subtitle',
            undefined,
            'Reports that a challenge is poorly designed and is causing incorrect edits. Mark one actioned once you have dealt with it — by archiving the challenge, say — or dismiss it.'
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as ChallengeReportStatusName)}
        >
          <SelectTrigger className="h-9 w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_FILTERS.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <label
          htmlFor={activeOnlyId}
          className="flex items-center gap-2 text-sm text-zinc-700 dark:text-slate-300"
        >
          <Checkbox
            id={activeOnlyId}
            checked={activeOnly}
            onCheckedChange={(checked) => setActiveOnly(checked === true)}
          />
          {t(
            'superAdminChallengeReports.activeOnlyLabel',
            undefined,
            'Only challenges that are still active'
          )}
        </label>
      </div>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t('superAdminChallengeReports.loadError', undefined, 'Could not load the reports.')}
        </p>
      ) : reports && reports.length > 0 ? (
        <ul className="space-y-3">
          {reports.map((report) => (
            <ReportRow key={report.id} report={report} />
          ))}
        </ul>
      ) : (
        <Empty className="py-16">
          <EmptyMedia>
            <Flag className="h-16 w-16 text-zinc-300 dark:text-slate-700" aria-hidden="true" />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>
              {t('superAdminChallengeReports.emptyTitle', undefined, 'Nothing to review')}
            </EmptyTitle>
            <EmptyDescription>
              {t(
                'superAdminChallengeReports.emptyDescription',
                undefined,
                'No challenge reports match these filters right now.'
              )}
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
