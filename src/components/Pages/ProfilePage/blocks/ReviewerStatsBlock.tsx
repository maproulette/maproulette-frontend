import { ShieldCheck } from 'lucide-react'
import { api } from '@/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useIntl } from '@/i18n'
import { useProfilePageContext } from '../contexts/ProfilePageContext'

export const ReviewerStatsBlock = () => {
  const { t } = useIntl()
  const { userId, timeRange } = useProfilePageContext()
  const { data, isLoading, isError } = api.user.metrics(userId, timeRange.monthDuration)

  const reviewStatusLabels: Record<string, string> = {
    '0': t('common.needed', undefined, 'Needed'),
    '1': t('common.approved', undefined, 'Approved'),
    '2': t('common.rejected', undefined, 'Rejected'),
    '3': t('common.assisted', undefined, 'Assisted'),
    '4': t('common.disputed', undefined, 'Disputed'),
    '5': t('common.unnecessary', undefined, 'Unnecessary'),
  }

  const reviewerTotal = Object.values(data?.reviewTasks ?? {}).reduce((a, b) => a + b, 0)

  if (!isLoading && !isError && reviewerTotal === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="size-4 text-green-600" aria-hidden="true" />
          {t('profilePage.reviewerStats.title', undefined, 'Reviews Performed')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : isError || !data ? (
          <p className="text-sm text-zinc-500 dark:text-slate-400">
            {t('profilePage.reviewerStats.loadError', undefined, "Couldn't load reviewer stats.")}
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(data?.reviewTasks ?? {}).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <dt className="text-zinc-600 dark:text-slate-400">
                  {reviewStatusLabels[status] ??
                    t('common.statusWithStatus', { status }, 'Status {status}')}
                </dt>
                <dd className="font-medium font-mono tabular-nums">{count.toLocaleString()}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}
