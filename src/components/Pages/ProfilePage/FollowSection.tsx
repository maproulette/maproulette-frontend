import { Link } from '@tanstack/react-router'
import { Shield, ShieldOff, UserCheck, UserPlus, Users } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { FOLLOWER_STATUS } from '@/api/user/follow'
import { DocsLink } from '@/components/shared/DocsLink'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useAuthContext } from '@/contexts/AuthContext'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { cn, initials } from '@/lib/utils'
import type { PublicUser } from '@/types/User'
import { FollowedActivity } from './FollowedActivity'

const UserList = ({ users, emptyLabel }: { users: PublicUser[]; emptyLabel: string }) => {
  if (users.length === 0) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">{emptyLabel}</p>
  }
  return (
    <ul className="flex flex-wrap gap-3">
      {users.map((user) => (
        <li key={user.id}>
          <Link
            to="/profile/$userId"
            params={{ userId: String(user.id) }}
            className="flex items-center gap-2 rounded-full bg-zinc-100 py-1 pr-3 pl-1 text-sm hover:bg-zinc-200 dark:bg-slate-800 dark:hover:bg-slate-700"
          >
            <Avatar className="size-6">
              <AvatarImage src={user.osmProfile?.avatarURL} alt={user.osmProfile?.displayName} />
              <AvatarFallback>{initials(user.osmProfile?.displayName ?? '?')}</AvatarFallback>
            </Avatar>
            {user.osmProfile?.displayName}
          </Link>
        </li>
      ))}
    </ul>
  )
}

/**
 * Who this mapper follows and who follows them, plus the control to follow
 * them yourself. Following is public on both sides, so the lists show on
 * anyone's profile.
 */
export const FollowSection = ({ userId }: { userId: number }) => {
  const { t } = useIntl()
  const { user: authedUser } = useAuthContext()
  const isOwnProfile = authedUser?.id === userId

  const { data: following } = api.user.following(userId)
  const { data: followers } = api.user.followers(userId)
  const { data: myFollowing } = api.user.following(authedUser?.id ?? 0, {
    enabled: !!authedUser && !isOwnProfile,
  })

  const followMutation = api.user.useFollowUser()
  const blockMutation = api.user.useBlockFollower()
  const unblockMutation = api.user.useUnblockFollower()
  const unfollowMutation = api.user.useUnfollowUser()

  const isFollowing = (myFollowing ?? []).some((user) => user.id === userId)
  const isPending = followMutation.isPending || unfollowMutation.isPending

  const toggleFollow = async () => {
    const mutation = isFollowing ? unfollowMutation : followMutation
    try {
      await mutation.mutateAsync({ userId, currentUserId: authedUser?.id })
    } catch (error) {
      logger.error('Failed to change follow state', { userId, isFollowing, error })
      toast.error(
        isFollowing
          ? t('profilePage.follow.unfollowFailed', undefined, 'Could not unfollow that mapper')
          : t('profilePage.follow.followFailed', undefined, 'Could not follow that mapper')
      )
    }
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-zinc-500" />
        <h2 className="font-medium text-zinc-800 dark:text-slate-200">
          {t('profilePage.follow.title', undefined, 'Following')}
        </h2>
        <DocsLink
          page="following"
          label={t('profilePage.follow.docsLink', undefined, 'About following')}
          className="text-zinc-400 no-underline hover:text-zinc-600"
        />
        {authedUser && !isOwnProfile && (
          <Button
            size="sm"
            variant={isFollowing ? 'outline' : 'default'}
            className="ml-auto gap-1.5"
            disabled={isPending}
            onClick={toggleFollow}
          >
            {isFollowing ? (
              <>
                <UserCheck className="h-4 w-4" />
                {t('profilePage.follow.unfollow', undefined, 'Following')}
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                {t('profilePage.follow.follow', undefined, 'Follow')}
              </>
            )}
          </Button>
        )}
      </div>

      {isOwnProfile && (following?.length ?? 0) > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
            {t(
              'profilePage.follow.activityTitle',
              undefined,
              'Recent activity from mappers you follow'
            )}
          </h3>
          <FollowedActivity following={following ?? []} />
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
            {t(
              'profilePage.follow.followingCount',
              { count: following?.length ?? 0 },
              'Following ({count})'
            )}
          </h3>
          <UserList
            users={following ?? []}
            emptyLabel={t(
              'profilePage.follow.notFollowingAnyone',
              undefined,
              'Not following anyone yet.'
            )}
          />
        </div>
        <div className="space-y-2">
          <h3 className="font-medium text-sm text-zinc-700 dark:text-zinc-300">
            {t(
              'profilePage.follow.followersCount',
              { count: followers?.length ?? 0 },
              'Followers ({count})'
            )}
          </h3>
          {followers?.length ? (
            <ul className="space-y-1">
              {followers.map((follower) => {
                const blocked = follower.status === FOLLOWER_STATUS.blocked
                return (
                  <li key={follower.user.id} className="flex items-center gap-2">
                    <Link
                      to="/profile/$userId"
                      params={{ userId: String(follower.user.id) }}
                      className={cn(
                        'flex min-w-0 flex-1 items-center gap-2 text-sm',
                        blocked && 'text-zinc-400 dark:text-zinc-500'
                      )}
                    >
                      <Avatar className="size-6">
                        <AvatarImage
                          src={follower.user.osmProfile?.avatarURL}
                          alt={follower.user.osmProfile?.displayName}
                        />
                        <AvatarFallback>
                          {initials(follower.user.osmProfile?.displayName ?? '?')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">{follower.user.osmProfile?.displayName}</span>
                      {blocked && (
                        <span className="shrink-0 text-xs">
                          {t('profilePage.follow.blockedLabel', undefined, '(blocked)')}
                        </span>
                      )}
                    </Link>
                    {isOwnProfile && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="gap-1.5"
                        onClick={() =>
                          (blocked ? unblockMutation : blockMutation).mutate({
                            userId: follower.user.id ?? 0,
                            currentUserId: authedUser?.id,
                          })
                        }
                      >
                        {blocked ? (
                          <>
                            <ShieldOff className="size-3.5" />
                            {t('profilePage.follow.unblock', undefined, 'Unblock')}
                          </>
                        ) : (
                          <>
                            <Shield className="size-3.5" />
                            {t('profilePage.follow.block', undefined, 'Block')}
                          </>
                        )}
                      </Button>
                    )}
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {t('profilePage.follow.noFollowers', undefined, 'No followers yet.')}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
