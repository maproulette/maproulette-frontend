import type { TranslateFn } from '@/i18n'

/** Image types the backend accepts for a team image. */
export const TEAM_IMAGE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] as const

/** `accept` attribute for the team image file picker. */
export const TEAM_IMAGE_ACCEPT = TEAM_IMAGE_MIME_TYPES.join(',')

/** Matches the 2MB cap enforced by the backend. */
export const TEAM_IMAGE_MAX_BYTES = 2 * 1024 * 1024

/**
 * Whether an avatar url points at an avatar we store for this team, as opposed
 * to an external url the team pasted in. The two are edited differently: ours
 * is replaced by uploading, theirs by typing.
 */
export const isUploadedTeamAvatarUrl = (
  avatarUrl: string | null | undefined,
  teamId: number
): boolean => !!avatarUrl && avatarUrl.startsWith(`/api/v2/team/${teamId}/avatar/file`)

/**
 * Validates a chosen file against the same limits the backend enforces, so an
 * obviously-bad file is rejected before it is uploaded.
 *
 * @returns An error message, or undefined when the file is acceptable
 */
export const teamImageFileProblem = (file: File, t: TranslateFn): string | undefined => {
  if (!(TEAM_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
    return t({
      id: 'teamImages.validation.fileType',
      defaultMessage: 'Image must be a PNG, JPEG, WebP or GIF file',
    })
  }
  if (file.size > TEAM_IMAGE_MAX_BYTES) {
    return t(
      {
        id: 'teamImages.validation.fileSize',
        defaultMessage: 'Image must be smaller than {max}MB',
      },
      { max: TEAM_IMAGE_MAX_BYTES / (1024 * 1024) }
    )
  }
  return undefined
}
