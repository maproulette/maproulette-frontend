import { substituteTaskProperties } from '@/components/TaskInfoPanel/taskUtils/propertyUtils'
import type { Challenge } from '@/types/Challenge'
import type { Task } from '@/types/Task'

const SHORT_URL = window.env.VITE_SHORT_URL

/**
 * During the MR4 public beta, append this hashtag to changeset comments so we
 * can tell whether a changeset originated from maproulette3 or maproulette4.
 * Temporary; remove once MR4 is the only frontend.
 */
const BETA_HASHTAG = '#maproulette-beta'

/**
 * Short link back to a task (e.g. "mpr.lt/c/49104/t/248076410"), or null when
 * no short-URL host is configured via VITE_SHORT_URL.
 */
export const taskShortLink = (challengeId: number, taskId: number): string | null =>
  SHORT_URL ? `${SHORT_URL}/c/${challengeId}/t/${taskId}` : null

/**
 * Build the OSM changeset comment for a task: the challenge's check-in comment
 * with `{{property}}` tags filled in from the task's properties, a short link
 * back to the task on MapRoulette, and the beta hashtag. Used by both the embedded and
 * external editor paths so they check in identically.
 *
 * The short link is omitted for disabled/draft challenges (it wouldn't resolve)
 * and when VITE_SHORT_URL is unset.
 */
export const buildChangesetComment = (challenge: Challenge, task: Task): string => {
  const link = challenge.enabled ? taskShortLink(challenge.id, task.id) : null
  const checkinComment = substituteTaskProperties(challenge.checkinComment, task)
  const comment = (link ? `${checkinComment} ${link}` : checkinComment).trim()
  return comment.includes(BETA_HASHTAG) ? comment : `${comment} ${BETA_HASHTAG}`.trim()
}
