import { ExternalLink } from 'lucide-react'
import { PointsTicker } from '@/components/shared/PointsTicker'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { useIntl } from '@/i18n'
import { initials } from '@/lib/utils'
import type { PublicUser, User } from '@/types/User'

interface Props {
  user: User | PublicUser
  showLivePoints: boolean
}

export const ProfileHeader = ({ user, showLivePoints }: Props) => {
  const { t } = useIntl()
  const displayName = user.osmProfile?.displayName ?? ''
  const avatarURL = user.osmProfile?.avatarURL
  const createdDate = user.created
    ? new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'long' }).format(
        new Date(user.created)
      )
    : null

  return (
    <div className="mb-6 flex flex-col items-center text-center">
      <Avatar className="mb-4 size-32">
        <AvatarImage src={avatarURL} alt={displayName} />
        <AvatarFallback className="font-semibold text-base">{initials(displayName)}</AvatarFallback>
      </Avatar>
      <h1 className="mb-2 font-bold text-base">{displayName}</h1>
      {createdDate && (
        <p className="mb-4 text-zinc-500 dark:text-slate-400">
          {t('profilePage.header.userSince', { date: createdDate }, 'User since: {date}')}
        </p>
      )}
      {showLivePoints && (
        <div className="mb-4">
          <PointsTicker size="lg" minDigits={6} />
        </div>
      )}
      <div className="flex gap-4">
        <a
          href={`https://www.openstreetmap.org/user/${encodeURIComponent(displayName)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {t('profilePage.header.osmProfileLink', undefined, 'OSM Profile')}
          <ExternalLink className="size-4" />
        </a>
        <a
          href={`https://osmcha.org/users/${encodeURIComponent(displayName)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-blue-600 underline hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {t('profilePage.header.osmChaLink', undefined, 'OSMCha')}
          <ExternalLink className="size-4" />
        </a>
      </div>
    </div>
  )
}
