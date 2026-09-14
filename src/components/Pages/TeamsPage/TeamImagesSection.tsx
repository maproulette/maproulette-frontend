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
import { isApprovedImage, isPendingImage, isRejectedImage } from '@/types/TeamImage'

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

const SubHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="font-medium text-xs text-zinc-600 uppercase tracking-wide dark:text-slate-400">
    {children}
  </h3>
)

/**
 * The team's challenge image. A team carries one: members request a
 * replacement here, and it only takes over from the image currently in use
 * once a super admin approves it.
 */
export const TeamImagesSection = ({ teamId, isAdmin, currentUserId }: TeamImagesSectionProps) => {
  const { t } = useIntl()
  const nameFieldId = useId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [name, setName] = useState('')

  const { data: images, isLoading, isError } = api.teamImage.forTeam(teamId)
  const requestImage = api.teamImage.useRequestImage()

  // The endpoint returns the team's whole history, but at most one image is in
  // use and at most one is awaiting review — everything else is a past
  // rejection, kept so a member can see why their request was turned down.
  const current = images?.find(isApprovedImage)
  const pending = images?.find(isPendingImage)
  const rejected = images?.filter(isRejectedImage) ?? []

  const problem = file ? teamImageFileProblem(file, t) : undefined
  // The backend refuses a second outstanding request, so the form says why up
  // front rather than letting the upload fail.
  const blockedByPending = !!pending

  const handleSubmit = async () => {
    if (!file || problem || blockedByPending) return
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
          {t('teamImages.heading', undefined, 'Challenge image')}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-slate-400">
          {t(
            'teamImages.description',
            undefined,
            'The image this team can put on its challenges. A team has one image: anyone on the team can request a replacement, and once a super admin approves it, it takes over from the current one on every challenge using it.'
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
              disabled={blockedByPending}
            />
          </div>
          <div className="min-w-56 flex-1">
            <Input
              ref={fileInputRef}
              type="file"
              accept={TEAM_IMAGE_ACCEPT}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              aria-label={t('teamImages.fileLabel', undefined, 'Image file')}
              disabled={blockedByPending}
            />
          </div>
          <DisabledTooltip
            show={blockedByPending}
            message={t(
              'teamImages.requestDisabledReason',
              undefined,
              'This team already has an image awaiting review. Withdraw it before requesting a different one.'
            )}
          >
            <Button
              onClick={handleSubmit}
              disabled={!file || !!problem || blockedByPending || requestImage.isPending}
            >
              <ImagePlus className="size-4" aria-hidden="true" />{' '}
              {requestImage.isPending
                ? t('teamImages.requesting', undefined, 'Submitting...')
                : current
                  ? t('teamImages.replaceButton', undefined, 'Request replacement')
                  : t('teamImages.requestButton', undefined, 'Request image')}
            </Button>
          </DisabledTooltip>
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
          {t('teamImages.loadError', undefined, "Could not load this team's image.")}
        </p>
      ) : (
        <div className="space-y-3">
          <div className="space-y-2">
            <SubHeading>{t('teamImages.currentHeading', undefined, 'In use')}</SubHeading>
            {current ? (
              <ul>
                <ImageRow image={current} canDelete={canDelete(current)} />
              </ul>
            ) : (
              <p className="text-sm text-zinc-600 dark:text-slate-400">
                {t('teamImages.empty', undefined, 'This team has no challenge image yet.')}
              </p>
            )}
          </div>

          {pending && (
            <div className="space-y-2">
              <SubHeading>
                {t('teamImages.pendingHeading', undefined, 'Awaiting review')}
              </SubHeading>
              <ul>
                <ImageRow image={pending} canDelete={canDelete(pending)} />
              </ul>
              <p className="text-xs text-zinc-500 dark:text-slate-400">
                {current
                  ? t(
                      'teamImages.pendingReplaces',
                      undefined,
                      'If a super admin approves this, it replaces the image in use above.'
                    )
                  : t(
                      'teamImages.pendingFirst',
                      undefined,
                      "It becomes the team's image once a super admin approves it."
                    )}
              </p>
            </div>
          )}

          {rejected.length > 0 && (
            <div className="space-y-2">
              <SubHeading>{t('teamImages.rejectedHeading', undefined, 'Not approved')}</SubHeading>
              <ul className="space-y-2">
                {rejected.map((image) => (
                  <ImageRow key={image.id} image={image} canDelete={canDelete(image)} />
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
