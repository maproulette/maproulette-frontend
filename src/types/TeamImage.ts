/**
 * A team-owned challenge display image. Members request one; a super admin
 * approves it; from then on any member of that team can attach it to their
 * challenges.
 *
 * Declared by hand rather than sourced from the generated schema so it stays
 * available until `openApiTypes.ts` is regenerated against a backend carrying
 * the team image endpoints.
 */
export type TeamImageStatus = 'pending' | 'approved' | 'rejected'

/** Matches the backend's org.maproulette.framework.model.TeamImage status constants. */
export const TEAM_IMAGE_STATUS_PENDING = 0
export const TEAM_IMAGE_STATUS_APPROVED = 1
export const TEAM_IMAGE_STATUS_REJECTED = 2

export type TeamImage = {
  id: number
  teamId: number
  teamName?: string | null
  name: string
  contentType: string
  size: number
  status: number
  statusName: TeamImageStatus | string
  requestedBy?: number | null
  requestedByName?: string | null
  reviewedBy?: number | null
  reviewedByName?: string | null
  reviewedAt?: string | null
  reviewComment?: string | null
  created: string
  modified: string
  /** Root-relative path serving the bytes; resolve with `resolveChallengeImageUrl`. */
  url: string
}

export const isPendingImage = (image: Pick<TeamImage, 'status'>): boolean =>
  image.status === TEAM_IMAGE_STATUS_PENDING

export const isApprovedImage = (image: Pick<TeamImage, 'status'>): boolean =>
  image.status === TEAM_IMAGE_STATUS_APPROVED
