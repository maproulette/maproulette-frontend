import { CheckCircle2 } from 'lucide-react'
import { api } from '@/api'
import { DigitDisplay } from '@/components/shared/DigitDisplay'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useIntl } from '@/i18n'
import { getStatusLabel, STATUS_KEY_TO_ID } from '@/lib/taskConstants'
import { useProfilePageContext } from '../contexts/ProfilePageContext'

const COUNTED_STATUSES = ['fixed', 'falsePositive', 'alreadyFixed', 'tooHard', 'skipped'] as const

export const TaskStatsBlock = () => {
  const { t, formatNumber } = useIntl()
  const { userId, timeRange } = useProfilePageContext()
  const { data, isLoading, isError } = api.user.metrics(userId, timeRange.monthDuration)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <CheckCircle2 className="size-4 text-teal-600" aria-hidden="true" />
          {t({ id: 'common.tasks', defaultMessage: 'Tasks' })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <Skeleton className="h-12 w-32" />
        ) : isError || !data ? (
          <p className="text-sm text-zinc-500 dark:text-slate-400">
            {t({
              id: 'profilePage.taskStats.loadError',
              defaultMessage: "Couldn't load task stats.",
            })}
          </p>
        ) : (
          <>
            <div>
              <div className="mb-1 text-xs text-zinc-500 uppercase tracking-wide dark:text-slate-400">
                {t({
                  id: 'profilePage.taskStats.totalCompleted',
                  defaultMessage: 'Total completed',
                })}
              </div>
              <DigitDisplay
                value={data.tasks?.total ?? 0}
                size="lg"
                ariaLabel={t(
                  {
                    id: 'profilePage.taskStats.totalCompletedValue',
                    defaultMessage: '{count, plural, one {# task} other {# tasks}}',
                  },
                  { count: data.tasks?.total ?? 0 }
                )}
              />
            </div>
            {data.tasks && (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                {COUNTED_STATUSES.map((status) => (
                  <div key={status} className="flex justify-between">
                    <dt className="text-zinc-600 dark:text-slate-400">
                      {getStatusLabel(t, STATUS_KEY_TO_ID[status])}
                    </dt>
                    <dd className="font-medium font-mono tabular-nums">
                      {formatNumber(data.tasks?.[status] ?? 0)}
                    </dd>
                  </div>
                ))}
              </dl>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
