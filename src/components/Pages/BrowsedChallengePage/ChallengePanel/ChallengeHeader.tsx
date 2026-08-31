import { Link } from '@tanstack/react-router'
import { Bookmark, Heart, MessageSquare, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { Button } from '@/components/ui/Button'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
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
    formattedDate,
    user,
  } = useBrowsedChallengeContext()
  const name = challenge.name
  const { openComments } = useChallengeModals()
  const { t } = useIntl()
  const needsSignIn = !user?.id
  const likeSignInMsg = t(
    'browsedChallengePage.header.signInToLike',
    undefined,
    'Sign in to like challenges'
  )
  const saveSignInMsg = t(
    'browsedChallengePage.header.signInToSave',
    undefined,
    'Sign in to save challenges'
  )

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
        t(
          'browsedChallengePage.header.pleaseSignInToSave',
          undefined,
          'Please sign in to save challenges'
        )
      )
      return
    }

    try {
      if (isFavorited) {
        await unfavoriteMutation.mutateAsync(challenge.id)
        toast.success(
          t('browsedChallengePage.header.removedFromFavorites', undefined, 'Removed from favorites')
        )
      } else {
        await favoriteMutation.mutateAsync(challenge.id)
        toast.success(
          t('browsedChallengePage.header.addedToFavorites', undefined, 'Added to favorites')
        )
      }
    } catch (error) {
      logger.error('Error toggling favorite', { error })
      toast.error(
        t(
          'browsedChallengePage.header.failedToUpdateFavorite',
          undefined,
          'Failed to update favorite status'
        )
      )
    }
  }

  const handleLike = async () => {
    if (!challenge.id) return
    if (!user?.id) {
      toast.error(
        t(
          'browsedChallengePage.header.pleaseSignInToLike',
          undefined,
          'Please sign in to like challenges'
        )
      )
      return
    }

    try {
      if (isLiked) {
        await unlikeMutation.mutateAsync(challenge.id)
        toast.success(t('browsedChallengePage.header.likeRemoved', undefined, 'Like removed'))
      } else {
        await likeMutation.mutateAsync(challenge.id)
        toast.success(
          t('browsedChallengePage.header.challengeLiked', undefined, 'Challenge liked!')
        )
      }
    } catch (error) {
      logger.error('Error toggling like', { error })
      toast.error(
        t(
          'browsedChallengePage.header.failedToUpdateLike',
          undefined,
          'Failed to update like status'
        )
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
            'browsedChallengePage.header.checkOutChallenge',
            { name },
            'Check out this challenge: {name}'
          ),
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success(t('common.linkCopiedToClipboard', undefined, 'Link copied to clipboard'))
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url)
          toast.success(t('common.linkCopiedToClipboard', undefined, 'Link copied to clipboard'))
        } catch (clipboardError) {
          logger.error('Error copying to clipboard', { error: clipboardError })
          toast.error(
            t('browsedChallengePage.header.failedToShare', undefined, 'Failed to share challenge')
          )
        }
      }
    }
  }

  const taxonomyItems: Array<{ label: string; className: string }> = []

  if (challenge.paused) {
    taxonomyItems.push({
      label: t('common.paused', undefined, 'Paused'),
      className: 'text-amber-500 dark:text-amber-400',
    })
  }

  if (challenge.isArchived) {
    taxonomyItems.push({
      label: t('common.archived', undefined, 'Archived'),
      className: 'text-zinc-500 dark:text-zinc-400',
    })
  }

  if (!challenge.enabled) {
    taxonomyItems.push({
      label: t('browsedChallengePage.header.taxonomy.undiscoverable', undefined, 'Undiscoverable'),
      className: 'text-red-500 dark:text-red-400',
    })
  }

  if (isFavorited) {
    taxonomyItems.push({
      label: t('browsedChallengePage.header.taxonomy.favorite', undefined, 'Favorite'),
      className: 'text-pink-500 dark:text-pink-400',
    })
  }

  if (challenge.featured) {
    taxonomyItems.push({
      label: t('common.featured', undefined, 'Featured'),
      className: 'text-cyan-500 dark:text-cyan-400',
    })
  }

  if (challenge.popularity && challenge.popularity > 0) {
    taxonomyItems.push({
      label: t('common.popular', undefined, 'Popular'),
      className: 'text-orange-500 dark:text-orange-400',
    })
  }

  const isNewest = challenge.created && Date.now() - challenge.created < 30 * 24 * 60 * 60 * 1000

  if (isNewest) {
    taxonomyItems.push({
      label: t('common.newest', undefined, 'Newest'),
      className: 'text-yellow-500 dark:text-yellow-400',
    })
  }

  if (challenge.cooperativeType === COOPERATIVE_TYPE_TAGS) {
    taxonomyItems.push({
      label: t('browsedChallengePage.header.taxonomy.tagFix', undefined, 'Tag Fix'),
      className: 'text-rose-500 dark:text-rose-400',
    })
  }

  if (challenge.cooperativeType === COOPERATIVE_TYPE_CHANGEFILE) {
    taxonomyItems.push({
      label: t('browsedChallengePage.header.taxonomy.cooperative', undefined, 'Cooperative'),
      className: 'text-rose-500 dark:text-rose-400',
    })
  }

  return (
    <div
      className={cn(
        'transition-all duration-500 ease-in-out',
        isScrolled ? 'mb-0 min-w-0 flex-1' : 'mb-6 w-full space-y-2.5'
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
            <ChallengeActionButtons />
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
            <ChallengeActionButtons />
          </div>
        </div>
      )}

      {/* Title Row - with ellipsis on opposite side when scrolled */}
      <div
        className={cn('flex items-center gap-2', isScrolled ? 'justify-between' : 'justify-start')}
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
        {isScrolled && (
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
                    ? t(
                        'browsedChallengePage.header.unlikeChallenge',
                        undefined,
                        'Unlike challenge'
                      )
                    : t('browsedChallengePage.header.likeChallenge', undefined, 'Like challenge')
                }
              >
                <Heart
                  className={cn('size-4 transition-all', isLiked && 'fill-red-500 text-red-500')}
                />
              </Button>
            </DisabledTooltip>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={openComments}
              aria-label={t('browsedChallengePage.header.viewComments', undefined, 'View comments')}
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
                    ? t(
                        'browsedChallengePage.header.removeFromFavorites',
                        undefined,
                        'Remove from favorites'
                      )
                    : t('browsedChallengePage.header.addToFavorites', undefined, 'Add to favorites')
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
              aria-label={t(
                'browsedChallengePage.header.shareChallenge',
                undefined,
                'Share challenge'
              )}
            >
              <Share2 className="size-4" />
            </Button>
            <ChallengeActionButtons />
          </div>
        )}
      </div>

      {!isScrolled && (
        <>
          <div className="max-h-20 overflow-hidden opacity-100 transition-all duration-500 ease-in-out">
            {(projectName || ownerName || formattedDate) && (
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
                    {(ownerName || formattedDate || likeCount > 0) && (
                      <span className="text-zinc-400 dark:text-white">•</span>
                    )}
                  </>
                ) : projectName ? (
                  <>
                    <span className="break-all font-medium">{projectName}</span>
                    {(ownerName || formattedDate || likeCount > 0) && (
                      <span className="text-zinc-400 dark:text-white">•</span>
                    )}
                  </>
                ) : null}
                {ownerName && (
                  <>
                    <span className="whitespace-nowrap">
                      {t('browsedChallengePage.header.byPrefix', undefined, 'by')}{' '}
                      <a
                        href={`https://www.openstreetmap.org/user/${encodeURIComponent(ownerName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium transition-colors hover:text-zinc-900 dark:hover:text-slate-200"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ownerName}
                      </a>
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
                    {likeCount === 1
                      ? t('browsedChallengePage.header.likeCountSingular', undefined, '1 like')
                      : t(
                          'browsedChallengePage.header.likeCountPlural',
                          { count: likeCount },
                          '{count} likes'
                        )}
                  </span>
                )}
              </div>
            )}
          </div>
          {/* Like, Comments, Save, and Share Buttons - Bottom of Header */}
          <div
            className="relative z-10 mt-4 grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="toolbar"
          >
            <DisabledTooltip
              show={needsSignIn}
              message={likeSignInMsg}
              className="w-full sm:w-auto"
            >
              <Button
                variant={isLiked ? 'default' : 'outline'}
                size="sm"
                className="w-full gap-1.5 whitespace-nowrap rounded-full sm:w-auto"
                onClick={handleLike}
                disabled={needsSignIn}
              >
                <Heart
                  className={cn('size-4 transition-all', isLiked && 'fill-red-500 text-red-500')}
                />
                {isLiked
                  ? t('browsedChallengePage.header.liked', undefined, 'Liked')
                  : t('browsedChallengePage.header.like', undefined, 'Like')}
              </Button>
            </DisabledTooltip>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 whitespace-nowrap rounded-full sm:w-auto"
              onClick={openComments}
            >
              <MessageSquare className="size-3.5" />
              {t('browsedChallengePage.header.comments', undefined, 'Comments')}
            </Button>
            <DisabledTooltip
              show={needsSignIn}
              message={saveSignInMsg}
              className="w-full sm:w-auto"
            >
              <Button
                variant={isFavorited ? 'default' : 'outline'}
                size="sm"
                className="w-full gap-1.5 whitespace-nowrap rounded-full sm:w-auto"
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
                  ? t('browsedChallengePage.header.saved', undefined, 'Saved')
                  : t('common.save', undefined, 'Save')}
              </Button>
            </DisabledTooltip>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 whitespace-nowrap rounded-full sm:w-auto"
              onClick={handleShare}
            >
              <Share2 className="size-3.5" />
              {t('common.share', undefined, 'Share')}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
