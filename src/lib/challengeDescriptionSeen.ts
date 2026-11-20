import { z } from 'zod'
import { sessionStored } from '@/lib/storage'

/**
 * Challenges whose description the mapper has demonstrably read this session - either by
 * being on the challenge page, or by ticking the confirmation on the task entry gate.
 *
 * Session-scoped on purpose: it survives reloads and in-app navigation (so a mapper working
 * through a challenge is asked once), but a fresh session starts clean.
 */
const seen = sessionStored('challengeDescriptionsSeen', z.array(z.number()), [])

export const hasSeenChallengeDescription = (challengeId: number | undefined): boolean =>
  challengeId !== undefined && seen.get().includes(challengeId)

export const markChallengeDescriptionSeen = (challengeId: number | undefined): void => {
  if (challengeId === undefined) return
  const ids = seen.get()
  if (!ids.includes(challengeId)) seen.set([...ids, challengeId])
}
