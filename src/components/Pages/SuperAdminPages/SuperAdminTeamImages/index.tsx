import { Check, ImageIcon, X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/Button'
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/Empty'
import { Input } from '@/components/ui/Input'
import { Loader } from '@/components/ui/Loader'
import { useIntl } from '@/i18n'
import { formatDate } from '@/lib/date'
import { logger } from '@/lib/logger'
import { resolveTeamImageUrl } from '@/lib/teamImage'
import type { TeamImage } from '@/types/TeamImage'

/**
 * A pending request. The image itself isn't served until it's approved, so the
 * reviewer previews the bytes from a blob fetched with credentials rather than
 * from the public url.
 */
const PendingRow = ({ image }: { image: TeamImage }) => {
  const { t } = useIntl()
  const [comment, setComment] = useState('')
  const approve = api.teamImage.useApproveImage()
  const reject = api.teamImage.useRejectImage()
  const busy = approve.isPending || reject.isPending

  const decide = async (decision: 'approve' | 'reject') => {
    const mutation = decision === 'approve' ? approve : reject
    try {
      await mutation.mutateAsync({ imageId: image.id, comment: comment.trim() || undefined })
      toast.success(
        decision === 'approve'
          ? t('superAdminTeamImages.approveSuccess', undefined, 'Image approved')
          : t('superAdminTeamImages.rejectSuccess', undefined, 'Image rejected')
      )
    } catch (error) {
      logger.error('Team image review failed', { decision, error: String(error) })
      toast.error(
        t('superAdminTeamImages.reviewError', undefined, 'Could not record that decision')
      )
    }
  }

  return (
    <li className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-slate-700">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-100 dark:bg-slate-800">
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
        <p className="text-xs text-zinc-500 dark:text-slate-400">
          {t(
            'superAdminTeamImages.requestMeta',
            {
              team: image.teamName ?? String(image.teamId),
              user: image.requestedByName ?? t('common.unknown', undefined, 'Unknown'),
              date: formatDate(new Date(image.created)),
            },
            '{team} · requested by {user} on {date}'
          )}
        </p>
        <p className="text-xs text-zinc-400 dark:text-slate-500">
          {image.contentType} · {Math.round(image.size / 1024)} KB
        </p>
      </div>
      <Input
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t('superAdminTeamImages.commentPlaceholder', undefined, 'Note (optional)')}
        className="w-56"
        aria-label={t('superAdminTeamImages.commentLabel', undefined, 'Review note')}
      />
      <div className="flex gap-2">
        <Button size="sm" onClick={() => decide('approve')} disabled={busy}>
          <Check className="size-4" aria-hidden="true" />{' '}
          {t('superAdminTeamImages.approve', undefined, 'Approve')}
        </Button>
        <Button size="sm" variant="outline" onClick={() => decide('reject')} disabled={busy}>
          <X className="size-4" aria-hidden="true" />{' '}
          {t('superAdminTeamImages.reject', undefined, 'Reject')}
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
  const { data: images, isLoading, isError } = api.teamImage.pending()

  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4">
      <div>
        <h1 className="font-bold text-xl text-zinc-900 dark:text-zinc-50">
          {t('superAdminTeamImages.title', undefined, 'Team challenge images')}
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t(
            'superAdminTeamImages.subtitle',
            undefined,
            'Images teams have requested for their challenges. Approving one makes it selectable by everyone on that team.'
          )}
        </p>
      </div>

      {isLoading ? (
        <Loader />
      ) : isError ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t('superAdminTeamImages.loadError', undefined, 'Could not load the review queue.')}
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
            <ImageIcon className="h-16 w-16 text-zinc-300 dark:text-slate-700" aria-hidden="true" />
          </EmptyMedia>
          <EmptyContent>
            <EmptyTitle>
              {t('superAdminTeamImages.emptyTitle', undefined, 'Nothing to review')}
            </EmptyTitle>
            <EmptyDescription>
              {t(
                'superAdminTeamImages.emptyDescription',
                undefined,
                'No team has an image awaiting approval right now.'
              )}
            </EmptyDescription>
          </EmptyContent>
        </Empty>
      )}
    </div>
  )
}
