import type { Challenge } from '@/types/Challenge'

/** Challenge status ids, mirroring `Challenge.STATUS_*` in the backend. */
export const CHALLENGE_STATUS_NONE = 0
export const CHALLENGE_STATUS_BUILDING = 1
export const CHALLENGE_STATUS_FAILED = 2
export const CHALLENGE_STATUS_READY = 3
export const CHALLENGE_STATUS_PARTIALLY_LOADED = 4
export const CHALLENGE_STATUS_FINISHED = 5
export const CHALLENGE_STATUS_DELETING_TASKS = 6

/**
 * Whether a challenge has no work left in it.
 *
 * The backend flips a challenge to FINISHED once none of its tasks are created
 * or skipped, and Explore hides those. That status can lag behind the counts
 * though (it is only refreshed when a task status changes), so a bar reading
 * 100% also counts as complete — otherwise a card would show a full progress
 * bar with nothing marking it done.
 *
 * @param completionPercentage the percentage actually being displayed, when the
 *   caller derived it from live stats rather than the challenge's own field.
 */
export const isChallengeComplete = (
  challenge: Pick<Challenge, 'status' | 'completionPercentage'>,
  completionPercentage?: number
): boolean =>
  challenge.status === CHALLENGE_STATUS_FINISHED ||
  (completionPercentage ?? challenge.completionPercentage ?? 0) >= 100
