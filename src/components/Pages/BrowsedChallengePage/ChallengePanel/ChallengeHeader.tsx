import { Link } from '@tanstack/react-router'
import { Bookmark, Heart, Map as MapIcon, MessageSquare, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { SidebarIndicator } from '@/components/shared/SidebarIndicator'
import { Button } from '@/components/ui/Button'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import { DropdownMenuItem } from '@/components/ui/DropdownMenu'
import { useIsDesktopLayoutContext } from '@/contexts/LayoutContext'
import { useMapToggle } from '@/contexts/MapToggleContext'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { cn } from '@/lib/utils'
import { ChallengeActionButtons } from './ChallengeActionButtons'
import { useChallengeModals } from './ChallengeModals/ChallengeModalsContext'

interface ChallengeHeaderProps {
  isScrolled?: boolean
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
  const name = challenge.name
  // A team-owned challenge is credited to the team. Gate on the id rather than
  // the name so the creator's name never flashes up before the team's arrives.
  const ownedByTeam = ownerTeamId !== undefined
  const bylineName = ownedByTeam ? ownerTeamName : ownerName
  const { openComments } = useChallengeModals()
  const isDesktop = useIsDesktopLayoutContext()
  const { setShowMap } = useMapToggle()
  const { t } = useIntl()
  const needsSignIn = !user?.id
  const likeSignInMsg = t({
    id: 'browsedChallengePage.header.signInToLike',
    defaultMessage: 'Sign in to like challenges',
  })
  const saveSignInMsg = t({
    id: 'browsedChallengePage.header.signInToSave',
    defaultMessage: 'Sign in to save challenges',
  })

  const favoriteMutation = api.challenge.useFavoriteChallenge()
  const unfavoriteMutation = api.challenge.useUnfavoriteChallenge()
  const likeMutation = api.challenge.useLikeChallenge()
  const unlikeMutation = api.challenge.useUnlikeChallenge()

  const { data: likeCountData } = api.challenge.getChallengeLikeCount(challenge.id ?? 0)
  const likeCount = likeCountData?.likeCount ?? 0

  const handleFavorite = async () => {
    if (!challenge.id) return
    if (!user?.id) {
      toast.error(
        t({
          id: 'browsedChallengePage.header.pleaseSignInToSave',
          defaultMessage: 'Please sign in to save challenges',
        })
      )
      return
    }

    try {
      if (isFavorited) {
        await unfavoriteMutation.mutateAsync(challenge.id)
        toast.success(
          t({
            id: 'browsedChallengePage.header.removedFromFavorites',
            defaultMessage: 'Removed from favorites',
          })
        )
      } else {
        await favoriteMutation.mutateAsync(challenge.id)
        toast.success(
          t({
            id: 'browsedChallengePage.header.addedToFavorites',
            defaultMessage: 'Added to favorites',
          })
        )
      }
    } catch (error) {
      logger.error('Error toggling favorite', { error })
      toast.error(
        t({
          id: 'browsedChallengePage.header.failedToUpdateFavorite',
          defaultMessage: 'Failed to update favorite status',
        })
      )
    }
  }

  const handleLike = async () => {
    if (!challenge.id) return
    if (!user?.id) {
      toast.error(
        t({
          id: 'browsedChallengePage.header.pleaseSignInToLike',
          defaultMessage: 'Please sign in to like challenges',
        })
      )
      return
    }

    try {
      if (isLiked) {
        await unlikeMutation.mutateAsync(challenge.id)
        toast.success(
          t({ id: 'browsedChallengePage.header.likeRemoved', defaultMessage: 'Like removed' })
        )
      } else {
        await likeMutation.mutateAsync(challenge.id)
        toast.success(
          t({
            id: 'browsedChallengePage.header.challengeLiked',
            defaultMessage: 'Challenge liked!',
          })
        )
      }
    } catch (error) {
      logger.error('Error toggling like', { error })
      toast.error(
        t({
          id: 'browsedChallengePage.header.failedToUpdateLike',
          defaultMessage: 'Failed to update like status',
        })
      )
    }
  }

  const handleShare = async () => {
    if (!challenge.id) return

    const url = `${window.location.origin}/challenge/${challenge.id}`
    try {
      if (navigator.share) {
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
      } else {
        await navigator.clipboard.writeText(url)
        toast.success(
          t({ id: 'common.linkCopiedToClipboard', defaultMessage: 'Link copied to clipboard' })
        )
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url)
          toast.success(
            t({ id: 'common.linkCopiedToClipboard', defaultMessage: 'Link copied to clipboard' })
          )
        } catch (clipboardError) {
          logger.error('Error copying to clipboard', { error: clipboardError })
          toast.error(
            t({
              id: 'browsedChallengePage.header.failedToShare',
              defaultMessage: 'Failed to share challenge',
            })
          )
        }
      }
    }
  }

  const taxonomyItems: Array<{ label: string; className: string }> = []

  if (challenge.paused) {
    taxonomyItems.push({
      label: t({ id: 'common.paused', defaultMessage: 'Paused' }),
      className: 'text-amber-500 dark:text-amber-400',
    })
  }

  if (challenge.isArchived) {
    taxonomyItems.push({
      label: t({ id: 'common.archived', defaultMessage: 'Archived' }),
      className: 'text-zinc-500 dark:text-zinc-400',
    })
  }

  if (!challenge.enabled) {
    taxonomyItems.push({
      label: t({
        id: 'browsedChallengePage.header.taxonomy.undiscoverable',
        defaultMessage: 'Undiscoverable',
      }),
      className: 'text-red-500 dark:text-red-400',
    })
  }

  if (isFavorited) {
    taxonomyItems.push({
      label: t({ id: 'browsedChallengePage.header.taxonomy.favorite', defaultMessage: 'Favorite' }),
      className: 'text-pink-500 dark:text-pink-400',
    })
  }

  if (challenge.featured) {
    taxonomyItems.push({
      label: t({ id: 'common.featured', defaultMessage: 'Featured' }),
      className: 'text-cyan-500 dark:text-cyan-400',
    })
  }

  if (challenge.popularity && challenge.popularity > 0) {
    taxonomyItems.push({
      label: t({ id: 'common.popular', defaultMessage: 'Popular' }),
      className: 'text-orange-500 dark:text-orange-400',
    })
  }

  const isNewest = challenge.created && Date.now() - challenge.created < 30 * 24 * 60 * 60 * 1000

  if (isNewest) {
    taxonomyItems.push({
      label: t({ id: 'common.newest', defaultMessage: 'Newest' }),
      className: 'text-yellow-500 dark:text-yellow-400',
    })
  }

  if (challenge.cooperativeType === COOPERATIVE_TYPE_TAGS) {
    taxonomyItems.push({
      label: t({ id: 'common.tagFix', defaultMessage: 'Tag Fix' }),
      className: 'text-rose-500 dark:text-rose-400',
    })
  }

  if (challenge.cooperativeType === COOPERATIVE_TYPE_CHANGEFILE) {
    taxonomyItems.push({
      label: t({
        id: 'common.cooperative',
        defaultMessage: 'Cooperative',
      }),
      className: 'text-rose-500 dark:text-rose-400',
    })
  }

  const socialMenuItems = isDesktop ? undefined : (
    <>
      <DropdownMenuItem
        onClick={handleLike}
        disabled={needsSignIn}
        title={needsSignIn ? likeSignInMsg : undefined}
      >
        <Heart className={cn('size-4', isLiked && 'fill-red-500 text-red-500')} />
        {isLiked
          ? t({ id: 'browsedChallengePage.header.liked', defaultMessage: 'Liked' })
          : t({ id: 'browsedChallengePage.header.like', defaultMessage: 'Like' })}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={openComments}>
        <MessageSquare className="size-4" />
        {t({ id: 'common.comments', defaultMessage: 'Comments' })}
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={handleFavorite}
        disabled={needsSignIn}
        title={needsSignIn ? saveSignInMsg : undefined}
      >
        <Bookmark className={cn('size-4', isFavorited && 'fill-yellow-500 text-yellow-500')} />
        {isFavorited
          ? t({ id: 'browsedChallengePage.header.saved', defaultMessage: 'Saved' })
          : t({ id: 'common.save', defaultMessage: 'Save' })}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={handleShare}>
        <Share2 className="size-4" />
        {t({ id: 'common.share', defaultMessage: 'Share' })}
      </DropdownMenuItem>
    </>
  )

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-in-out',
        isScrolled ? 'mb-0 min-w-0 flex-1' : 'mb-3 w-full space-y-2.5 md:mb-6'
      )}
    >
      {/* Taxonomy and Actions Row */}
      {!isScrolled && taxonomyItems.length > 0 && (
        <div className="flex items-center justify-between gap-2">
          <ul className="flex flex-wrap items-center gap-2.5">
            {taxonomyItems.map((item) => (
              <li key={item.label}>
                <span className={cn('font-medium text-xs uppercase tracking-wide', item.className)}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
          <div
            className="relative z-10 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="toolbar"
          >
            <ChallengeActionButtons leadingItems={socialMenuItems} />
          </div>
        </div>
      )}

      {/* Show ellipsis even when no taxonomy items */}
      {!isScrolled && taxonomyItems.length === 0 && (
        <div className="flex items-center justify-end">
          <div
            className="relative z-10 flex items-center gap-1"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="toolbar"
          >
            <ChallengeActionButtons leadingItems={socialMenuItems} />
          </div>
        </div>
      )}

      {/* Title and byline, with the owning team's image alongside them */}
      <div className={cn(!isScrolled && 'flex items-start gap-4')}>
        <div className={cn('min-w-0', !isScrolled && 'flex-1 space-y-2.5')}>
          {/* Title Row - with ellipsis on opposite side when scrolled */}
          <div
            className={cn(
              'flex items-center gap-2',
              isScrolled ? 'justify-between' : 'justify-start'
            )}
          >
            <h1
              className={cn(
                'min-w-0 font-bold text-zinc-900 leading-tight tracking-tight transition-all duration-500 ease-in-out dark:text-white',
                isScrolled
                  ? 'flex-1 truncate text-base'
                  : 'line-clamp-2 w-full break-words text-left font-semibold text-base'
              )}
            >
              {name}
            </h1>
            {isScrolled && !isDesktop && (
              <div
                className="relative z-10 flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="toolbar"
              >
                <ChallengeActionButtons leadingItems={socialMenuItems} />
              </div>
            )}
            {isScrolled && isDesktop && (
              <div
                className="relative z-10 flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                role="toolbar"
              >
                <DisabledTooltip show={needsSignIn} message={likeSignInMsg}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleLike}
                    disabled={needsSignIn}
                    aria-label={
                      isLiked
                        ? t({
                            id: 'browsedChallengePage.header.unlikeChallenge',
                            defaultMessage: 'Unlike challenge',
                          })
                        : t({
                            id: 'browsedChallengePage.header.likeChallenge',
                            defaultMessage: 'Like challenge',
                          })
                    }
                  >
                    <Heart
                      className={cn(
                        'size-4 transition-all',
                        isLiked && 'fill-red-500 text-red-500'
                      )}
                    />
                  </Button>
                </DisabledTooltip>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={openComments}
                  aria-label={t({
                    id: 'browsedChallengePage.header.viewComments',
                    defaultMessage: 'View comments',
                  })}
                >
                  <MessageSquare className="size-4" />
                </Button>
                <DisabledTooltip show={needsSignIn} message={saveSignInMsg}>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleFavorite}
                    disabled={needsSignIn}
                    aria-label={
                      isFavorited
                        ? t({
                            id: 'browsedChallengePage.header.removeFromFavorites',
                            defaultMessage: 'Remove from favorites',
                          })
                        : t({
                            id: 'browsedChallengePage.header.addToFavorites',
                            defaultMessage: 'Add to favorites',
                          })
                    }
                  >
                    <Bookmark
                      className={cn(
                        'size-4 transition-all',
                        isFavorited && 'fill-yellow-500 text-yellow-500'
                      )}
                    />
                  </Button>
                </DisabledTooltip>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleShare}
                  aria-label={t({
                    id: 'browsedChallengePage.header.shareChallenge',
                    defaultMessage: 'Share challenge',
                  })}
                >
                  <Share2 className="size-4" />
                </Button>
                <ChallengeActionButtons />
              </div>
            )}
          </div>

          {!isScrolled && (
            <div className="max-h-20 overflow-hidden opacity-100 transition-all duration-500 ease-in-out">
              {(projectName || bylineName || formattedDate) && (
                <div
                  className="flex flex-wrap items-center gap-x-2.5 gap-y-0 font-medium text-xs text-zinc-600 dark:text-slate-400"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.stopPropagation()
                    }
                  }}
                  role="toolbar"
                >
                  {projectName && projectId ? (
                    <>
                      <Link
                        to="/project/$projectId"
                        params={{ projectId: String(projectId) }}
                        className="break-all font-medium transition-colors hover:text-zinc-900 dark:hover:text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {projectName}
                      </Link>
                      {(bylineName || formattedDate || likeCount > 0) && (
                        <span className="text-zinc-400 dark:text-white">•</span>
                      )}
                    </>
                  ) : projectName ? (
                    <>
                      <span className="break-all font-medium">{projectName}</span>
                      {(bylineName || formattedDate || likeCount > 0) && (
                        <span className="text-zinc-400 dark:text-white">•</span>
                      )}
                    </>
                  ) : null}
                  {bylineName && (
                    <>
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
                                  className="font-medium transition-colors hover:text-zinc-900 dark:hover:text-slate-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {chunks}
                                </Link>
                              ) : (
                                <a
                                  href={`https://www.openstreetmap.org/user/${encodeURIComponent(bylineName)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium transition-colors hover:text-zinc-900 dark:hover:text-slate-200"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {chunks}
                                </a>
                              ),
                          }
                        )}
                      </span>
                      {(formattedDate || likeCount > 0) && (
                        <span className="text-zinc-400 dark:text-white">•</span>
                      )}
                    </>
                  )}
                  {formattedDate && (
                    <>
                      <span className="whitespace-nowrap">{formattedDate}</span>
                      {likeCount > 0 && <span className="text-zinc-400 dark:text-white">•</span>}
                    </>
                  )}
                  {likeCount > 0 && (
                    <span className="whitespace-nowrap">
                      {t(
                        {
                          id: 'browsedChallengePage.header.likeCount',
                          defaultMessage: '{count, plural, one {# like} other {# likes}}',
                        },
                        { count: likeCount }
                      )}
                    </span>
                  )}
                </div>
              )}
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
      </div>

      {/* Like, Comments, Save, and Share Buttons - Bottom of Header */}
      {!isScrolled && isDesktop && (
        <div
          className="relative z-10 mt-4 flex flex-wrap items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="toolbar"
        >
          <DisabledTooltip show={needsSignIn} message={likeSignInMsg}>
            <Button
              variant={isLiked ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5 whitespace-nowrap rounded-full"
              onClick={handleLike}
              disabled={needsSignIn}
            >
              <Heart
                className={cn('size-4 transition-all', isLiked && 'fill-red-500 text-red-500')}
              />
              {isLiked
                ? t({ id: 'browsedChallengePage.header.liked', defaultMessage: 'Liked' })
                : t({ id: 'browsedChallengePage.header.like', defaultMessage: 'Like' })}
            </Button>
          </DisabledTooltip>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 whitespace-nowrap rounded-full"
            onClick={openComments}
          >
            <MessageSquare className="size-3.5" />
            {t({ id: 'common.comments', defaultMessage: 'Comments' })}
          </Button>
          <DisabledTooltip show={needsSignIn} message={saveSignInMsg}>
            <Button
              variant={isFavorited ? 'default' : 'outline'}
              size="sm"
              className="gap-1.5 whitespace-nowrap rounded-full"
              onClick={handleFavorite}
              disabled={needsSignIn}
            >
              <Bookmark
                className={cn(
                  'size-4 transition-all',
                  isFavorited && 'fill-yellow-500 text-yellow-500'
                )}
              />
              {isFavorited
                ? t({ id: 'browsedChallengePage.header.saved', defaultMessage: 'Saved' })
                : t({ id: 'common.save', defaultMessage: 'Save' })}
            </Button>
          </DisabledTooltip>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 whitespace-nowrap rounded-full"
            onClick={handleShare}
          >
            <Share2 className="size-3.5" />
            {t({ id: 'common.share', defaultMessage: 'Share' })}
          </Button>
        </div>
      )}
      {!isScrolled && !isDesktop && (
        <Button
          variant="outline"
          className="relative z-10 mt-3 w-full gap-2 rounded-full"
          onClick={() => setShowMap(true)}
        >
          <MapIcon className="size-4" />
          {t({ id: 'browsedChallengePage.footer.showMap', defaultMessage: 'Show Map' })}
        </Button>
      )}
    </div>
  )
}
