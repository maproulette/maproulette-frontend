import { useQuery } from '@tanstack/react-query'
import { Check, ImageIcon, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { pendingTeamImagesOptions, useApproveTeamImage, useRejectTeamImage } from '@/api/teamImage'
import { resolveTeamImageUrl } from '@/api/urls'
import { OsmUserLink } from '@/components/shared/OsmUserLink'
import { Button } from '@/components/ui/Button'
import { Empty, EmptyContent, EmptyMedia, EmptyTitle } from '@/components/ui/Empty'
import { Input } from '@/components/ui/Input'
import { Loader } from '@/components/ui/Loader'
import { useIntl } from '@/i18n'
import { formatDate } from '@/lib/date'
import { logger } from '@/lib/logger'
import type { TeamImage } from '@/types/TeamImage'

/**
 * A pending request. The image itself isn't served until it's approved, so the
 * reviewer previews the bytes from a blob fetched with credentials rather than
 * from the public url.
 */
const PendingRow = ({ image }: { image: TeamImage }) => {
  const { t, locale } = useIntl()
  const [comment, setComment] = useState('')
  const approve = useApproveTeamImage()
  const reject = useRejectTeamImage()
  const busy = approve.isPending || reject.isPending

  const decide = async (decision: 'approve' | 'reject') => {
    const mutation = decision === 'approve' ? approve : reject
    try {
      await mutation.mutateAsync({ imageId: image.id, comment: comment.trim() || undefined })
      toast.success(
        decision === 'approve'
          ? t({ id: 'superAdminTeamImages.approveSuccess', defaultMessage: 'Image approved' })
          : t({ id: 'superAdminTeamImages.rejectSuccess', defaultMessage: 'Image rejected' })
      )
    } catch (error) {
      logger.error('Team image review failed', { decision, error })
      toast.error(
        t({
          id: 'superAdminReview.reviewError',
          defaultMessage: 'Could not record that decision',
        })
      )
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-line p-3">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-muted">
        <img
          src={resolveTeamImageUrl(image.url)}
          alt=""
          className="h-full w-full object-cover"
          // A pending image isn't publicly served yet, so this preview can
          // legitimately fail; fall back to a placeholder rather than a broken
          // image icon.
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </span>
      <div className="min-w-48 flex-1">
        <p className="font-medium text-sm">{image.name}</p>
        <p className="text-fg-muted text-xs">
          {t(
            {
              id: 'superAdminTeamImages.requestMeta',
              defaultMessage: '{team} · requested by <link>{user}</link> on {date}',
            },
            {
              team: image.teamName ?? String(image.teamId),
              user: image.requestedByName ?? t({ id: 'common.unknown', defaultMessage: 'Unknown' }),
              link: (chunks) =>
                image.requestedByName ? (
                  <OsmUserLink username={image.requestedByName} className="hover:underline">
                    {chunks}
                  </OsmUserLink>
                ) : (
                  chunks
                ),
              date: formatDate(new Date(image.created), locale),
            }
          )}
        </p>
        <p className="text-fg-subtle text-xs">
          {image.contentType} · {Math.round(image.size / 1024)} KB
        </p>
      </div>
      <Input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t({
          id: 'superAdminReview.commentPlaceholder',
          defaultMessage: 'Note (optional)',
        })}
        className="w-56"
        aria-label={t({ id: 'superAdminReview.commentLabel', defaultMessage: 'Review note' })}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => decide('approve')} disabled={busy}>
          <Check className="size-4" aria-hidden="true" />{' '}
          {t({ id: 'superAdminTeamImages.approve', defaultMessage: 'Approve' })}
        </Button>
        <Button size="sm" variant="outline" onClick={() => decide('reject')} disabled={busy}>
          <X className="size-4" aria-hidden="true" />{' '}
          {t({ id: 'superAdminTeamImages.reject', defaultMessage: 'Reject' })}
        </Button>
      </div>
    </li>
  )
}

/**
 * The super admin queue of team challenge images awaiting review, oldest first.
 */
export const SuperAdminTeamImages = () => {
  const { t } = useIntl()
  const { data: images, isLoading, isError } = useQuery(pendingTeamImagesOptions())

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4">
      <h1 className="font-bold text-fg text-xl">
        {t({ id: 'superAdminTeamImages.title', defaultMessage: 'Team challenge images' })}
      </h1>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p className="text-fg-muted text-sm">
          {t({
            id: 'superAdminTeamImages.loadError',
            defaultMessage: 'Could not load the review queue.',
          })}
        </p>
      ) : images && images.length > 0 ? (
        <ul className="space-y-2">
          {images.map((image) => (
            <PendingRow key={image.id} image={image} />
          ))}
        </ul>
      ) : (
        <Empty className="py-16">
          <EmptyMedia>
            <ImageIcon className="h-16 w-16 text-line-strong" aria-hidden="true" />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>
              {t({ id: 'superAdminReview.emptyTitle', defaultMessage: 'Nothing to review' })}
            </EmptyTitle>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
