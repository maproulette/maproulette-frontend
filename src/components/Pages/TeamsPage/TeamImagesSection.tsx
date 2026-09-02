import { ImagePlus, Trash2 } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { TeamImageStatusBadge } from '@/components/shared/TeamImageStatusBadge'
import { Button } from '@/components/ui/Button'
import { DisabledTooltip } from '@/components/ui/DisabledTooltip'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/Skeleton'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import {
  resolveTeamImageUrl,
  TEAM_IMAGE_ACCEPT,
  TEAM_IMAGE_MAX_BYTES,
  teamImageFileProblem,
} from '@/lib/teamImage'
import type { TeamImage } from '@/types/TeamImage'
import { isPendingImage } from '@/types/TeamImage'

interface TeamImagesSectionProps {
  teamId: number
  /** Whether the viewer holds the team's admin role. */
  isAdmin: boolean
  /** The viewer's user id, used to decide who may withdraw a pending request. */
  currentUserId: number | undefined
}

const ImageRow = ({ image, canDelete }: { image: TeamImage; canDelete: boolean }) => {
  const { t } = useIntl()
  const deleteImage = api.teamImage.useDeleteImage()

  const handleDelete = async () => {
    try {
      await deleteImage.mutateAsync(image.id)
      toast.success(t('teamImages.deleteSuccess', undefined, 'Image removed'))
    } catch (error) {
      logger.error('Team image delete failed', { error: String(error) })
      toast.error(t('teamImages.deleteError', undefined, 'Could not remove image'))
    }
  }

  return (
    <li className="flex items-center gap-3 rounded-lg border border-zinc-200 p-3 dark:border-slate-700">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded bg-zinc-100 dark:bg-slate-800">
        {/* The team's own images are served to them whatever their review
            state, so a request still awaiting review still shows what was
            asked for. */}
        <img src={resolveTeamImageUrl(image.url)} alt="" className="h-full w-full object-cover" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{image.name}</p>
        <p className="truncate text-xs text-zinc-500 dark:text-slate-400">
          {image.requestedByName
            ? t('teamImages.requestedBy', { name: image.requestedByName }, 'Requested by {name}')
            : t('teamImages.requestedByUnknown', undefined, 'Requester no longer available')}
          {image.reviewComment ? ` · ${image.reviewComment}` : ''}
        </p>
      </div>
      <TeamImageStatusBadge status={image.status} />
      {canDelete ? (
        <Button
          variant="outline"
          size="sm"
          onClick={handleDelete}
          disabled={deleteImage.isPending}
          aria-label={t('teamImages.deleteLabel', { name: image.name }, 'Remove {name}')}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      ) : (
        <DisabledTooltip
          show
          message={t(
            'teamImages.deleteDisabledReason',
            undefined,
            'Only a team admin, or the requester of an image still awaiting review, can remove it'
          )}
        >
          <Button
            variant="outline"
            size="sm"
            disabled
            aria-label={t('common.delete', undefined, 'Delete')}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </DisabledTooltip>
      )}
    </li>
  )
}

/**
 * The team's challenge image library. Any member can request an image; it only
 * becomes usable on challenges once a super admin approves it.
 */
export const TeamImagesSection = ({ teamId, isAdmin, currentUserId }: TeamImagesSectionProps) => {
  const { t } = useIntl()
  const nameFieldId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')

  const { data: images, isLoading, isError } = api.teamImage.forTeam(teamId)
  const requestImage = api.teamImage.useRequestImage()

  const problem = file ? teamImageFileProblem(file, t) : undefined

  const handleSubmit = async () => {
    if (!file || problem) return
    try {
      await requestImage.mutateAsync({ teamId, imageFile: file, name: name.trim() || undefined })
      toast.success(
        t(
          'teamImages.requestSuccess',
          undefined,
          'Image submitted — a super admin will review it before it can be used'
        )
      )
      setFile(null)
      setName('')
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (error) {
      logger.error('Team image request failed', { error: String(error) })
      toast.error(t('teamImages.requestError', undefined, 'Could not submit the image'))
    }
  }

  const canDelete = (image: TeamImage) =>
    isAdmin || (isPendingImage(image) && image.requestedBy === currentUserId)

  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-medium text-sm text-zinc-700 dark:text-slate-300">
          {t('teamImages.heading', undefined, 'Challenge images')}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-slate-400">
          {t(
            'teamImages.description',
            undefined,
            'Images this team can put on its challenges. Anyone on the team can request one; a super admin has to approve it first.'
          )}
        </p>
      </div>

      <div className="space-y-2 rounded-lg border border-zinc-200 p-3 dark:border-slate-700">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-48 flex-1">
            <label
              htmlFor={nameFieldId}
              className="mb-1 block text-xs text-zinc-600 dark:text-slate-400"
            >
              {t('teamImages.nameLabel', undefined, 'Name (optional)')}
            </label>
            <Input
              id={nameFieldId}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('teamImages.namePlaceholder', undefined, 'Our logo')}
            />
          </div>
          <div className="min-w-56 flex-1">
            <Input
              ref={fileInputRef}
              type="file"
              accept={TEAM_IMAGE_ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              aria-label={t('teamImages.fileLabel', undefined, 'Image file')}
            />
          </div>
          <Button onClick={handleSubmit} disabled={!file || !!problem || requestImage.isPending}>
            <ImagePlus className="size-4" aria-hidden="true" />{' '}
            {requestImage.isPending
              ? t('teamImages.requesting', undefined, 'Submitting...')
              : t('teamImages.requestButton', undefined, 'Request image')}
          </Button>
        </div>
        <p
          className={
            problem
              ? 'text-red-600 text-xs dark:text-red-400'
              : 'text-xs text-zinc-500 dark:text-slate-400'
          }
        >
          {problem ??
            t(
              'teamImages.fileHint',
              { max: TEAM_IMAGE_MAX_BYTES / (1024 * 1024) },
              'PNG, JPEG, WebP or GIF, up to {max}MB. Square images look best.'
            )}
        </p>
      </div>

      {isLoading ? (
        <Skeleton className="h-16 w-full" />
      ) : isError ? (
        <p className="text-sm text-zinc-600 dark:text-slate-400">
          {t('teamImages.loadError', undefined, "Could not load this team's images.")}
        </p>
      ) : images && images.length > 0 ? (
        <ul className="space-y-2">
          {images.map((image) => (
            <ImageRow key={image.id} image={image} canDelete={canDelete(image)} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-600 dark:text-slate-400">
          {t('teamImages.empty', undefined, 'This team has no challenge images yet.')}
        </p>
      )}
    </section>
  )
}
