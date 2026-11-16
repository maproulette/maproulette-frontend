import { Link } from '@tanstack/react-router'
import { Trophy } from 'lucide-react'
import { api } from '@/api'
import { Progress } from '@/components/ui/Progress'
import { useIntl } from '@/i18n'
import { DashboardEmpty, DashboardSection } from './DashboardSection'

interface TopChallengesSectionProps {
  userId: number
}

export const TopChallengesSection = ({ userId }: TopChallengesSectionProps) => {
  const { t } = useIntl()
  const { data: challenges, isLoading, error } = api.user.topChallenges(userId, { limit: 5 })
  const maxActivity = Math.max(0, ...(challenges ?? []).map((c) => c.activity))

  return (
    <DashboardSection
      icon={<Trophy />}
      title={t({ id: 'dashboard.topChallenges.title', defaultMessage: 'Top challenges' })}
      isLoading={isLoading}
      error={error}
      className="flex-none"
    >
      {challenges?.length === 0 ? (
        <DashboardEmpty
          icon={<Trophy />}
          title={t({
            id: 'dashboard.topChallenges.empty.title',
            defaultMessage: 'No challenges yet',
          })}
          description={t({
            id: 'dashboard.topChallenges.empty.description',
            defaultMessage: 'The challenges you work on most will show up here',
          })}
        />
      ) : (
        <ol className="space-y-3">
          {challenges?.map((challenge) => (
            <li key={challenge.id}>
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <Link
                  to="/challenge/$challengeId"
                  params={{ challengeId: String(challenge.id) }}
                  className="truncate font-medium text-blue-600 hover:underline dark:text-blue-400"
                >
                  {challenge.name}
                </Link>
                <span className="shrink-0 text-zinc-600 tabular-nums dark:text-slate-400">
                  {t(
                    {
                      id: 'common.tasksWithCount',
                      defaultMessage: '{count, plural, one {# task} other {# tasks}}',
                    },
                    { count: challenge.activity }
                  )}
                </span>
              </div>
              <Progress
                value={maxActivity > 0 ? (challenge.activity / maxActivity) * 100 : 0}
                className="mt-1 h-1"
              />
            </li>
          ))}
        </ol>
      )}
    </DashboardSection>
  )
}
