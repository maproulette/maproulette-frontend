import { Link } from '@tanstack/react-router'
import { api } from '@/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { useIntl } from '@/i18n'
import { initials } from '@/lib/utils'
import type { User } from '@/types/User'

interface ProfileSummaryProps {
  user: User
}

export const ProfileSummary = ({ user }: ProfileSummaryProps) => {
  const { t, formatNumber } = useIntl()
  const { data: metrics } = api.user.metrics(user.id)
  const displayName = user.osmProfile.displayName

  const stats = [
    {
      label: t({ id: 'dashboard.profile.points', defaultMessage: 'Points' }),
      value: formatNumber(user.score ?? 0),
    },
    {
      label: t({ id: 'dashboard.profile.tasksCompleted', defaultMessage: 'Tasks completed' }),
      value: metrics?.tasks ? formatNumber(metrics.tasks.total ?? 0) : '--',
    },
  ]

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3 rounded-xl bg-white px-4 py-3 dark:bg-slate-900">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar className="size-10">
          <AvatarImage src={user.osmProfile.avatarURL || ''} alt={displayName} />
          <AvatarFallback className="font-semibold text-sm">{initials(displayName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h1 className="truncate font-semibold text-base text-zinc-900 dark:text-slate-100">
            {displayName}
          </h1>
          <Link
            to="/profile/$userId"
            params={{ userId: String(user.id) }}
            className="text-blue-600 text-sm hover:underline dark:text-blue-400"
          >
            {t({
              id: 'dashboard.profile.viewPublicProfile',
              defaultMessage: 'View public profile',
            })}
          </Link>
        </div>
      </div>
      <dl className="flex gap-6 sm:ml-auto">
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
  )
}
