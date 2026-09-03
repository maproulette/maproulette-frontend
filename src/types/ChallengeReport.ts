/**
 * A report filed against a challenge's design -- that it is poorly designed and
 * is causing incorrect edits -- as opposed to a bug or a feature request.
 *
 * Reports used to be filed as issues in a public GitHub repo. They are stored
 * in the MapRoulette database now, so a super admin triages them in-app and the
 * reporter's contact details stay private.
 *
 * Declared by hand rather than sourced from the generated schema so it stays
 * available until `openApiTypes.ts` is regenerated against a backend carrying
 * the challenge report endpoints.
 */
export type ChallengeReportStatusName = 'open' | 'actioned' | 'dismissed'

/** Matches the backend's org.maproulette.framework.model.ChallengeReport status constants. */
export const CHALLENGE_REPORT_STATUS_OPEN = 0
export const CHALLENGE_REPORT_STATUS_ACTIONED = 1
export const CHALLENGE_REPORT_STATUS_DISMISSED = 2

/** Bounds the backend enforces on the report text; mirrored here for the form. */
export const CHALLENGE_REPORT_MIN_LENGTH = 100
export const CHALLENGE_REPORT_MAX_LENGTH = 1000

export type ChallengeReport = {
  id: number
  challengeId: number
  challengeName?: string | null
  challengeIsArchived?: boolean | null
  projectId?: number | null
  projectName?: string | null
  reporterId?: number | null
  reporterName?: string | null
  /** Volunteered by the reporter for follow-up; only ever sent to super admins. */
  reporterEmail?: string | null
  comment: string
  status: number
  statusName: ChallengeReportStatusName | string
  reviewedBy?: number | null
  reviewedByName?: string | null
  reviewedAt?: string | null
  reviewComment?: string | null
  reportedAt: string
  /** Total matches for the query this report came from, for paging. */
  fullCount: number
}

export const isOpenReport = (report: Pick<ChallengeReport, 'status'>): boolean =>
  report.status === CHALLENGE_REPORT_STATUS_OPEN
