import { Link } from '@tanstack/react-router'
import { Activity } from 'lucide-react'
import { useMemo } from 'react'
import { api } from '@/api'
import { useIntl } from '@/i18n'
import { getStatusLabel } from '@/lib/taskConstants'
import { aggregateActivity } from './activityAggregation'
import { DashboardEmpty, DashboardSection } from './DashboardSection'
import { LockedTasksBlock } from './LockedTasksBlock'

interface RecentActivitySectionProps {
  userId: number
}

export const RecentActivitySection = ({ userId }: RecentActivitySectionProps) => {
  const { t, locale } = useIntl()
  const { data: activityData, isLoading, error } = api.user.activity()
  const { data: lockedTasks } = api.user.lockedTasks(userId)

  const days = useMemo(() => aggregateActivity(activityData, t, locale), [activityData, t, locale])

  return (
    <DashboardSection
      icon={<Activity />}
      title={t({ id: 'dashboard.activity.title', defaultMessage: 'Recent activity' })}
      isLoading={isLoading}
      error={error}
    >
      <LockedTasksBlock lockedTasks={lockedTasks ?? []} />

      {days.length === 0 && !lockedTasks?.length && (
        <DashboardEmpty
          icon={<Activity />}
          title={t({ id: 'dashboard.activity.empty.title', defaultMessage: 'No recent activity' })}
          description={t({
            id: 'dashboard.activity.empty.description',
            defaultMessage: 'Tasks you work on will show up here',
          })}
        />
      )}

      <div className="space-y-4">
        {days.map((day) => (
          <div key={day.date}>
            <h3 className="mb-2 border-line border-b pb-1 font-medium text-fg-muted text-xs">
              {day.date}
            </h3>
            <ul className="space-y-3">
              {day.challenges.map((challenge) => (
                <li key={challenge.parentId}>
                  <Link
                    to="/challenge/$challengeId"
                    params={{ challengeId: String(challenge.parentId) }}
                    className="font-medium text-link text-sm hover:underline"
                  >
                    {challenge.name}
                  </Link>
                  <ul className="mt-0.5 text-fg text-sm">
                    {challenge.actions.map((action) => (
                      <li key={action.status}>
                        {t(
                          {
                            id: 'dashboard.activity.statusCount',
                            defaultMessage:
                              '{count, plural, one {# task marked {status}} other {# tasks marked {status}}}',
                          },
                          {
                            count: action.count,
                            status: getStatusLabel(t, action.status) ?? String(action.status),
                          }
                        )}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </DashboardSection>
  )
}
