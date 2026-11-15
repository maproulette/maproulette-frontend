import { ExternalLink } from 'lucide-react'
import { api } from '@/api'
import { AchievementBadge } from '@/components/shared/AchievementBadge'
import { OsmUserLink } from '@/components/shared/OsmUserLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { useIntl } from '@/i18n'
import { initials } from '@/lib/utils'
import { achievementDefinitions } from '@/types/Achievement'
import type { User } from '@/types/User'

interface ProfileSummaryProps {
  user: User
}

export const ProfileSummary = ({ user }: ProfileSummaryProps) => {
  const { t, formatNumber, locale } = useIntl()
  const { data: metrics } = api.user.metrics(user.id)
  const displayName = user.osmProfile.displayName
  const earnedIds = new Set(user.achievements ?? [])
  const earned = achievementDefinitions.filter(({ id }) => earnedIds.has(id))
  const locked = achievementDefinitions.filter(({ id }) => !earnedIds.has(id))

  const stats = [
    {
      label: t({ id: 'dashboard.profile.points', defaultMessage: 'Points' }),
      value: formatNumber(user.score ?? 0),
    },
    {
      label: t({ id: 'dashboard.profile.tasksCompleted', defaultMessage: 'Tasks completed' }),
      value: metrics?.tasks ? formatNumber(metrics.tasks.total ?? 0) : '--',
    },
    {
      label: t({ id: 'dashboard.profile.userSince', defaultMessage: 'MapRoulette user since' }),
      value: user.created
        ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(
            new Date(user.created)
          )
        : '--',
    },
  ]

  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-xl bg-white px-4 py-3 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="size-10">
            <AvatarImage src={user.osmProfile.avatarURL || ''} alt={displayName} />
            <AvatarFallback className="font-semibold text-sm">
              {initials(displayName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-base text-zinc-900 dark:text-slate-100">
              {displayName}
            </h1>
            <OsmUserLink
              username={displayName}
              className="flex items-center gap-1 text-sm text-zinc-600 dark:text-slate-400"
            >
              {t({ id: 'dashboard.profile.osmProfile', defaultMessage: 'OpenStreetMap profile' })}
              <ExternalLink className="size-3.5" />
            </OsmUserLink>
          </div>
        </div>
        <dl className="flex flex-wrap gap-x-6 gap-y-2 sm:ml-auto">
          {stats.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-zinc-600 dark:text-slate-400">{label}</dt>
              <dd className="font-semibold text-base text-zinc-900 tabular-nums dark:text-slate-100">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-xs text-zinc-600 dark:text-slate-400">
          {t(
            {
              id: 'dashboard.profile.achievements',
              defaultMessage: 'Achievements ({earned, number} of {total, number})',
            },
            { earned: earned.length, total: achievementDefinitions.length }
          )}
        </h2>
        <div className="flex flex-wrap gap-1.5">
          {earned.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} size="xs" />
          ))}
          {locked.map((achievement) => (
            <AchievementBadge key={achievement.id} achievement={achievement} size="xs" locked />
          ))}
        </div>
      </div>
    </div>
  )
}
