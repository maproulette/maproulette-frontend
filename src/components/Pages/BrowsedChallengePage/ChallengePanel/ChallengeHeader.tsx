import { Link } from '@tanstack/react-router'
import {
  Bookmark,
  Heart,
  type LucideIcon,
  Map as MapIcon,
  MessageSquare,
  Share2,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { OsmUserLink } from '@/components/shared/OsmUserLink'
import { SidebarIndicator } from '@/components/shared/SidebarIndicator'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import { DropdownMenuItem } from '@/components/ui/DropdownMenu'
import { useIsDesktopLayoutContext } from '@/contexts/LayoutContext'
import { useMapToggle } from '@/contexts/MapToggleContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { ChallengeActionButtons } from './ChallengeActionButtons'
import { useChallengeModals } from './ChallengeModals/ChallengeModalsContext'

interface ChallengeHeaderProps {
  isScrolled?: boolean
}

interface SocialAction {
  key: string
  icon: LucideIcon
  iconClassName?: string
  label: string
  active?: boolean
  onClick: () => void
  /** Set when the action needs a signed-in user and there isn't one. */
  signInMessage?: string
}

const COOPERATIVE_TYPE_TAGS = 1
const COOPERATIVE_TYPE_CHANGEFILE = 2

export const ChallengeHeader = ({ isScrolled = false }: ChallengeHeaderProps) => {
  const {
    projectId,
    challenge,
    isFavorited,
    isLiked,
    projectName,
    ownerName,
    ownerTeamId,
    ownerTeamName,
    formattedDate,
    user,
  } = useBrowsedChallengeContext()
  const challengeId = challenge.id ?? 0
  const name = challenge.name
  // A team-owned challenge is credited to the team. Gate on the id rather than
  // the name so the creator's name never flashes up before the team's arrives.
  const bylineName = ownerTeamId !== undefined ? ownerTeamName : ownerName
  const { openComments } = useChallengeModals()
  const isDesktop = useIsDesktopLayoutContext()
  const { setShowMap } = useMapToggle()
  const { t } = useIntl()
  const needsSignIn = !user?.id

  const favoriteMutation = api.challenge.useFavoriteChallenge()
  const unfavoriteMutation = api.challenge.useUnfavoriteChallenge()
  const likeMutation = api.challenge.useLikeChallenge()
  const unlikeMutation = api.challenge.useUnlikeChallenge()

  const { data: likeCountData } = api.challenge.getChallengeLikeCount(challengeId)
  const likeCount = likeCountData?.likeCount ?? 0

  const handleSave = () =>
    (isFavorited ? unfavoriteMutation : favoriteMutation).mutate(challengeId, {
      onError: () =>
        toast.error(
          t({
            id: 'browsedChallengePage.header.failedToUpdateSaved',
            defaultMessage: 'Failed to update saved challenges',
          })
        ),
    })

  const handleLike = () =>
    (isLiked ? unlikeMutation : likeMutation).mutate(challengeId, {
      onError: () =>
        toast.error(
          t({
            id: 'browsedChallengePage.header.failedToUpdateLike',
            defaultMessage: 'Failed to update like status',
          })
        ),
    })

  const handleShare = async () => {
    const url = `${window.location.origin}/challenge/${challengeId}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: name,
          text: t(
            {
              id: 'browsedChallengePage.header.checkOutChallenge',
              defaultMessage: 'Check out this challenge: {name}',
            },
            { name }
          ),
          url,
        })
        return
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') return
        // Anything else (e.g. no share targets) falls through to the clipboard
      }
    }
    await navigator.clipboard.writeText(url)
    toast.success(
      t({ id: 'common.linkCopiedToClipboard', defaultMessage: 'Link copied to clipboard' })
    )
  }

  const socialActions: SocialAction[] = [
    {
      key: 'like',
      icon: Heart,
      iconClassName: isLiked ? 'fill-red-500 text-red-500' : undefined,
      label: isLiked
        ? t({ id: 'browsedChallengePage.header.liked', defaultMessage: 'Liked' })
        : t({ id: 'browsedChallengePage.header.like', defaultMessage: 'Like' }),
      active: isLiked,
      onClick: handleLike,
      signInMessage: needsSignIn
        ? t({
            id: 'browsedChallengePage.header.signInToLike',
            defaultMessage: 'Sign in to like challenges',
          })
        : undefined,
    },
    {
      key: 'comments',
      icon: MessageSquare,
      label: t({ id: 'common.comments', defaultMessage: 'Comments' }),
      onClick: openComments,
    },
    {
      key: 'save',
      icon: Bookmark,
      iconClassName: isFavorited ? 'fill-yellow-500 text-yellow-500' : undefined,
      label: isFavorited
        ? t({ id: 'browsedChallengePage.header.saved', defaultMessage: 'Saved' })
        : t({ id: 'common.save', defaultMessage: 'Save' }),
      active: isFavorited,
      onClick: handleSave,
      signInMessage: needsSignIn
        ? t({
            id: 'browsedChallengePage.header.signInToSave',
            defaultMessage: 'Sign in to save challenges',
          })
        : undefined,
    },
    {
      key: 'share',
      icon: Share2,
      label: t({ id: 'common.share', defaultMessage: 'Share' }),
      onClick: handleShare,
    },
  ]

  // Pills only fit in the expanded desktop header; everywhere else the actions
  // go in the overflow menu. Disabled menu items can't show a tooltip, so the
  // sign-in-only ones are left out of the menu instead.
  const showPills = isDesktop && !isScrolled
  const menuItems = showPills
    ? undefined
    : socialActions
        .filter((action) => !action.signInMessage)
        .map(({ key, icon: Icon, iconClassName, label, onClick }) => (
          <DropdownMenuItem key={key} onClick={onClick}>
            <Icon className={cn('size-4', iconClassName)} />
            {label}
          </DropdownMenuItem>
        ))

  const badges: Array<{ label: string; variant: 'warning' | 'secondary' }> = []
  if (challenge.paused) {
    badges.push({ label: t({ id: 'common.paused', defaultMessage: 'Paused' }), variant: 'warning' })
  }
  if (challenge.isArchived) {
    badges.push({
      label: t({ id: 'common.archived', defaultMessage: 'Archived' }),
      variant: 'warning',
    })
  }
  if (!challenge.enabled) {
    badges.push({
      label: t({
        id: 'browsedChallengePage.header.taxonomy.undiscoverable',
        defaultMessage: 'Undiscoverable',
      }),
      variant: 'warning',
    })
  }
  if (challenge.featured) {
    badges.push({
      label: t({ id: 'common.featured', defaultMessage: 'Featured' }),
      variant: 'secondary',
    })
  }
  if (challenge.cooperativeType === COOPERATIVE_TYPE_TAGS) {
    badges.push({
      label: t({ id: 'common.tagFix', defaultMessage: 'Tag Fix' }),
      variant: 'secondary',
    })
  }
  if (challenge.cooperativeType === COOPERATIVE_TYPE_CHANGEFILE) {
    badges.push({
      label: t({ id: 'common.cooperative', defaultMessage: 'Cooperative' }),
      variant: 'secondary',
    })
  }

  const bylineParts: Array<{ key: string; node: ReactNode }> = []
  if (projectName) {
    bylineParts.push({
      key: 'project',
      node: (
        <Link
          to="/project/$projectId"
          params={{ projectId: String(projectId) }}
          className="link break-all"
        >
          {projectName}
        </Link>
      ),
    })
  }
  if (bylineName) {
    bylineParts.push({
      key: 'owner',
      node: (
        <span className="whitespace-nowrap">
          {t(
            {
              id: 'browsedChallengePage.header.byline',
              defaultMessage: 'by <owner>{name}</owner>',
            },
            {
              name: bylineName,
              owner: (chunks) =>
                ownerTeamId !== undefined ? (
                  <Link
                    to="/teams/$teamId"
                    params={{ teamId: String(ownerTeamId) }}
                    className="link"
                  >
                    {chunks}
                  </Link>
                ) : (
                  <OsmUserLink username={bylineName} className="link">
                    {chunks}
                  </OsmUserLink>
                ),
            }
          )}
        </span>
      ),
    })
  }
  if (formattedDate) {
    bylineParts.push({
      key: 'date',
      node: <span className="whitespace-nowrap">{formattedDate}</span>,
    })
  }
  if (likeCount > 0) {
    bylineParts.push({
      key: 'likes',
      node: (
        <span className="whitespace-nowrap">
          {t(
            {
              id: 'browsedChallengePage.header.likeCount',
              defaultMessage: '{count, plural, one {# like} other {# likes}}',
            },
            { count: likeCount }
          )}
        </span>
      ),
    })
  }

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-in-out',
        isScrolled ? 'mb-0 min-w-0 flex-1' : 'mb-3 w-full md:mb-6'
      )}
    >
      {/* Title and byline, with the owning team's image and the actions menu alongside */}
      <div className={cn('flex gap-3', isScrolled ? 'items-center' : 'items-start')}>
        <div className={cn('min-w-0 flex-1', !isScrolled && 'space-y-2')}>
          {isScrolled ? (
            <h1 className="truncate font-semibold text-base text-zinc-900 leading-tight tracking-tight dark:text-white">
              {name}
            </h1>
          ) : (
            // The badges sit inline after the name so they wrap along with it
            <div className="break-words text-xl leading-snug">
              <h1 className="inline font-semibold text-zinc-900 tracking-tight dark:text-white">
                {name}
              </h1>
              {badges.map((badge) => (
                <Badge key={badge.label} variant={badge.variant} className="ml-2 align-middle">
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {!isScrolled && bylineParts.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 text-sm text-zinc-600 dark:text-slate-400">
              {bylineParts.map(({ key, node }, i) => (
                <span key={key} className="contents">
                  {i > 0 && <span className="text-zinc-400 dark:text-slate-500">•</span>}
                  {node}
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Renders nothing when the owning team has no approved image */}
        {!isScrolled && (
          <SidebarIndicator
            avatarUrl={challenge.avatarUrl}
            className="relative top-auto right-auto h-16 w-16 shrink-0"
          />
        )}
        <div className="relative z-10 shrink-0">
          <ChallengeActionButtons leadingItems={menuItems} />
        </div>
      </div>

      {showPills && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {socialActions.map(
            ({ key, icon: Icon, iconClassName, label, active, onClick, signInMessage }) => (
              <DisabledTooltip key={key} show={!!signInMessage} message={signInMessage ?? ''}>
                <Button
                  variant={active ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5 whitespace-nowrap rounded-full"
                  onClick={onClick}
                  disabled={!!signInMessage}
                >
                  <Icon className={cn('size-4', iconClassName)} />
                  {label}
                </Button>
              </DisabledTooltip>
            )
          )}
        </div>
      )}
      {!isScrolled && !isDesktop && (
        <Button
          variant="outline"
          className="mt-3 w-full gap-2 rounded-full"
          onClick={() => setShowMap(true)}
        >
          <MapIcon className="size-4" />
          {t({ id: 'browsedChallengePage.footer.showMap', defaultMessage: 'Show Map' })}
        </Button>
      )}
    </div>
  )
}
