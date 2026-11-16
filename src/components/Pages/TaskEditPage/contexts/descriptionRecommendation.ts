import type { Challenge } from '@/types/Challenge'
import type { Project } from '@/types/Project'

/**
 * The prose describing a challenge. Challenges don't all fill in the same field:
 * `description` is the long form, `blurb` the short teaser, and `instruction` the mapping
 * brief - take the first one that has anything in it.
 */
export const challengeDescriptionText = (
  challenge: Pick<Challenge, 'description' | 'blurb' | 'instruction'> | null | undefined
): string => {
  const candidates = [challenge?.description, challenge?.blurb, challenge?.instruction]
  return candidates.find((text) => text?.trim())?.trim() ?? ''
}

/** The prose describing a project, which only carries the one field. */
export const projectDescriptionText = (
  project: Pick<Project, 'description'> | null | undefined
): string => project?.description?.trim() ?? ''

export interface RecommendationState {
  /** Text there'd be to read; nothing written means nothing to recommend. */
  description: string
  /** The challenge page was open this session, or the description was already read here. */
  challengeSeen: boolean
  /** They hold this task's lock, so they've worked it before. */
  holdsThisLock: boolean
  /** They hold a lock on another task in this challenge, so likewise. */
  holdsLockInChallenge: boolean
}

/**
 * Whether to nudge the mapper towards the challenge description - i.e. they got here
 * without ever being somewhere it was shown to them. Anything that shows they have had the
 * chance (the challenge page, a lock they hold in the challenge) drops the nudge.
 */
export const shouldRecommendDescription = ({
  description,
  challengeSeen,
  holdsThisLock,
  holdsLockInChallenge,
}: RecommendationState): boolean =>
  description.length > 0 && !challengeSeen && !holdsThisLock && !holdsLockInChallenge
