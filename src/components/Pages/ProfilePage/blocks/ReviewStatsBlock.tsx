import { ClipboardCheck } from 'lucide-react'
import { api } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useIntl } from '@/i18n'
import type { UserReviewMetrics } from '@/types/User'
import { useProfilePageContext } from '../contexts/ProfilePageContext'

export const ReviewStatsBlock = () => {
  const { t, formatNumber } = useIntl()
  const { userId, timeRange } = useProfilePageContext()
  const { data, isLoading, isError } = api.user.metrics(userId, timeRange.monthDuration)

  const reviewStatusLabels: [keyof UserReviewMetrics, string][] = [
    ['requested', t({ id: 'common.needed', defaultMessage: 'Needed' })],
    ['approved', t({ id: 'common.approved', defaultMessage: 'Approved' })],
    ['rejected', t({ id: 'common.rejected', defaultMessage: 'Rejected' })],
    ['assisted', t({ id: 'common.assisted', defaultMessage: 'Assisted' })],
    ['disputed', t({ id: 'common.disputed', defaultMessage: 'Disputed' })],
  ]
  const reviews = data?.reviewTasks

  const reviewedTotal = reviews?.total ?? 0

  if (!isLoading && !isError && reviewedTotal === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardCheck className="size-4 text-blue-600" aria-hidden="true" />
          {t({ id: 'profilePage.reviewStats.title', defaultMessage: 'Reviews Received' })}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isError || !data ? (
          <p className="text-sm text-zinc-500 dark:text-slate-400">
            {t({
              id: 'profilePage.reviewStats.loadError',
              defaultMessage: "Couldn't load review stats.",
            })}
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {reviewStatusLabels.map(([status, label]) => (
              <div key={status} className="flex justify-between">
                <dt className="text-zinc-600 dark:text-slate-400">{label}</dt>
                <dd className="font-medium font-mono tabular-nums">
                  {formatNumber(reviews?.[status] ?? 0)}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
