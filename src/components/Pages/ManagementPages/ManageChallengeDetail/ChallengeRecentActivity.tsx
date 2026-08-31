import { History } from 'lucide-react'
import { useMemo } from 'react'
import { api } from '@/api'
import { TASK_STATUS_LABELS } from '@/components/Pages/ManagementPages/taskStatusLabels'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { useIntl } from '@/i18n'
import type { ChallengeActivityEntry } from '@/types/Challenge'

const MAX_RAW_ENTRIES = 90
const MAX_DAY_GROUPS = 14

export const dateSortKey = (raw: string | number): string => {
  if (typeof raw === 'number') return new Date(raw).toISOString().slice(0, 10)
  const s = String(raw)
  if (/^\d+$/.test(s)) return new Date(Number(s)).toISOString().slice(0, 10)
  return s.slice(0, 10)
}

const formatDayHeading = (isoDay: string): string =>
  new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric' }).format(
    new Date(`${isoDay}T12:00:00`)
  )

const statusLabel = (status: number, statusName: string, t: ReturnType<typeof useIntl>['t']) => {
  return (
    TASK_STATUS_LABELS[status] ??
    statusName ??
    t('common.statusWithStatus', { status }, 'Status {status}')
  )
}

export const buildDayGroups = (entries: ChallengeActivityEntry[]) => {
  const trimmed = entries.slice(-MAX_RAW_ENTRIES)
  const byDay = new Map<string, ChallengeActivityEntry[]>()
  for (const row of trimmed) {
    const key = dateSortKey(row.date)
    const list = byDay.get(key)
    if (list) {
      list.push(row)
    } else {
      byDay.set(key, [row])
    }
  }

  const sortedDays = [...byDay.entries()]
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, MAX_DAY_GROUPS)

  return sortedDays
    .map(([day, rows]) => ({
      day,
      rows: rows.filter((r) => r.count > 0),
    }))
    .filter((g) => g.rows.length > 0)
}

interface ChallengeRecentActivityProps {
  challengeId: number
}

export const ChallengeRecentActivity = ({ challengeId }: ChallengeRecentActivityProps) => {
  const { t } = useIntl()
  const { data, isError } = api.challenge.getChallengeActivity(challengeId)

  // Reason: groups activity data by day - avoids expensive regrouping and sorting on every render
  const dayGroups = useMemo(() => (data?.length ? buildDayGroups(data) : []), [data])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          {t('common.recentActivity', undefined, 'Recent Activity')}
        </CardTitle>
        <CardDescription>
          {t(
            'manageChallengeDetail.recentActivity.description',
            undefined,
            'Task completions by status, grouped by day (same data as the legacy admin dashboard widget).'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="max-h-[min(60vh,520px)] overflow-y-auto pr-1">
        {isError ? (
          <p className="text-red-600 text-sm dark:text-red-400">
            {t(
              'manageChallengeDetail.recentActivity.loadError',
              undefined,
              'Could not load activity.'
            )}
          </p>
        ) : dayGroups.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {t('manageChallengeDetail.recentActivity.empty', undefined, 'No recent activity.')}
          </p>
        ) : (
          <ol className="relative ms-2 space-y-6 border-zinc-200 border-l ps-6 dark:border-slate-600">
            {dayGroups.map(({ day, rows }) => (
              <li key={day} className="relative">
                <span
                  className="-start-[29px] absolute mt-1.5 size-3 rounded-full border-2 border-zinc-200 bg-white dark:border-slate-600 dark:bg-slate-800"
                  aria-hidden
                />
                <h3 className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
                  {formatDayHeading(day)}
                </h3>
                <ul className="mt-2 space-y-2">
                  {rows.map((row) => (
                    <li
                      key={`${day}-${row.status}`}
                      className="flex flex-wrap items-baseline gap-2 text-sm"
                    >
                      <Badge variant="secondary" className="tabular-nums">
                        {row.count}
                      </Badge>
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {statusLabel(row.status, row.statusName, t)}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}
