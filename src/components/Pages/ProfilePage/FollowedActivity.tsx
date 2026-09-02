import { Link } from '@tanstack/react-router'
import { api } from '@/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { useIntl } from '@/i18n'
import { formatTimeAgo } from '@/lib/date'
import { initials } from '@/lib/utils'
import type { PublicUser } from '@/types/User'

/**
 * Recent activity from everyone this mapper follows, in one feed. Only shown
 * on your own profile, since it is assembled from who *you* follow.
 */
export const FollowedActivity = ({ following }: { following: PublicUser[] }) => {
  const { t } = useIntl()
  // recentActions identifies mappers by OSM id, not MapRoulette id.
  const osmIds = following
    .map((user) => user.osmProfile?.id)
    .filter((id): id is number => typeof id === 'number')

  const { data: actions, isError } = api.user.followedActivity(osmIds)

  if (osmIds.length === 0) return null

  if (isError) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {t(
          'profilePage.follow.activityUnavailable',
          undefined,
          'Recent activity could not be loaded.'
        )}
      </p>
    )
  }

  if (!actions?.length) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        {t(
          'profilePage.follow.noActivity',
          undefined,
          'No recent activity from mappers you follow.'
        )}
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {actions.map((action) => (
        <li key={action.id} className="flex items-start gap-2 text-sm">
          <Avatar className="size-6 shrink-0">
            <AvatarImage
              src={action.user?.osmProfile?.avatarURL}
              alt={action.user?.osmProfile?.displayName}
            />
            <AvatarFallback>{initials(action.user?.osmProfile?.displayName ?? '?')}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <span className="font-medium">{action.user?.osmProfile?.displayName}</span>{' '}
            {action.challenge ? (
              <>
                <span className="text-zinc-600 dark:text-zinc-400">
                  {t('profilePage.follow.activityOn', undefined, 'worked on')}
                </span>{' '}
                <Link
                  to="/challenge/$challengeId"
                  params={{ challengeId: String(action.challenge.id) }}
                  className="text-blue-600 hover:underline dark:text-blue-400"
                >
                  {action.challenge.name}
                </Link>
              </>
            ) : (
              <span className="text-zinc-600 dark:text-zinc-400">
                {t('profilePage.follow.activityGeneric', undefined, 'completed a task')}
              </span>
            )}
            {action.created && (
              <span className="ml-1 text-xs text-zinc-400">
                {formatTimeAgo(new Date(action.created))}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
