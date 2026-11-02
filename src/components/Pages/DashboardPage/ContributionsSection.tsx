import { Activity } from 'lucide-react'
import { useMemo } from 'react'
import { api } from '@/api'
import { Loader } from '@/components/ui/Loader'
import { useIntl } from '@/i18n'
import { getStatusLabel, STATUS_TEXT_COLORS } from '@/lib/taskConstants'
import { cn } from '@/lib/utils'
import { aggregateContributions } from './contributionsAggregation'
import { LockedTasksBlock } from './LockedTasksBlock'

const DISPLAYED_STATUS_IDS = new Set([1, 2, 3, 5, 6])

interface ContributionsSectionProps {
  userId: number
}

export const ContributionsSection = ({ userId }: ContributionsSectionProps) => {
  const { t } = useIntl()
  const { data: activityData, isLoading, error } = api.user.activity()
  const { data: lockedTasks } = api.user.lockedTasks(userId)
  const hasLockedTasks = (lockedTasks?.length ?? 0) > 0

  // Reason: groups and sorts activity data by date/challenge/status - expensive aggregation should not run on every render
  const { groupedActivities, totalTasks } = useMemo(
    () => aggregateContributions(activityData, t),
    [activityData, t]
  )

  const hasContributions = totalTasks > 0

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-xl bg-white dark:bg-slate-900">
      <div className="flex shrink-0 items-center gap-2 px-4 py-3">
        <Activity className="h-4 w-4 text-indigo-400" />
        <h3 className="font-medium text-sm text-zinc-800 dark:text-slate-200">
          {t({ id: 'dashboard.contributions.title', defaultMessage: 'Contributions' })}
        </h3>
        {hasContributions && (
          <span className="ml-auto font-bold text-indigo-400 text-sm">
            {totalTasks.toLocaleString()}
          </span>
        )}
      </div>
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {!error && <LockedTasksBlock userId={userId} />}

        {isLoading && (
          <div className="flex justify-center py-4">
            <Loader />
          </div>
        )}

        {error && (
          <div className="py-2 text-center text-red-400 text-sm">
            {t({ id: 'dashboard.common.failedToLoad', defaultMessage: 'Failed to load' })}
          </div>
        )}

        {!isLoading && !error && !hasContributions && !hasLockedTasks && (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="mb-2 rounded-lg bg-zinc-100 p-2 dark:bg-slate-700/50">
              <Activity className="h-5 w-5 text-zinc-400 dark:text-slate-500" />
            </div>
            <p className="text-sm text-zinc-600 dark:text-slate-400">
              {t({ id: 'dashboard.contributions.empty.title', defaultMessage: 'No contributions' })}
            </p>
            <p className="text-xs text-zinc-500 dark:text-slate-500">
              {t({ id: 'dashboard.contributions.empty.description', defaultMessage: 'Start mapping to track progress' }
              )}
            </p>
          </div>
        )}

        {!isLoading && !error && hasContributions && (
          <div className="relative space-y-4">
            {/* Timeline line */}
            <div className="absolute top-2 bottom-2 left-[7px] w-0.5 bg-gradient-to-b from-yellow-400/50 to-transparent" />

            {groupedActivities.map((group) => (
              <div key={group.date} className="relative pl-6">
                {/* Timeline dot */}
                <div className="absolute top-0.5 left-0 h-4 w-4 rounded-full bg-yellow-400" />

                {/* Date header */}
                <div className="mb-2 font-semibold text-xs text-yellow-400">{group.date}</div>

                {/* Challenges */}
                <div className="space-y-3">
                  {group.challenges.map((challenge) => (
                    <div key={challenge.parentId}>
                      {/* Challenge name */}
                      <div className="mb-1 font-medium text-emerald-400 text-sm">
                        {challenge.name}
                      </div>

                      {/* Actions */}
                      <div className="space-y-1 pl-2">
                        {challenge.actions.map((action) => (
                          <div key={action.status} className="flex items-center gap-2 text-xs">
                            <span
                              className={cn(
                                'flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-200 font-medium dark:bg-slate-700/50',
                                STATUS_TEXT_COLORS[action.status] || 'text-zinc-400'
                              )}
                            >
                              {action.count}
                            </span>
                            <span className="text-zinc-400 dark:text-slate-500">
                              {DISPLAYED_STATUS_IDS.has(action.status)
                                ? t({ id: 'dashboard.contributions.statusSetLabel', defaultMessage: 'Set Status on Task as {statusLabel}' }, {
                                      statusLabel:
                                        getStatusLabel(t, action.status) ?? String(action.status),
                                    }
                                  )
                                : t({ id: 'common.statusWithStatus', defaultMessage: 'Status {status}' }, { status: action.status }
                                  )}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
