import { logger } from '@/lib/logger'

const STORAGE_KEY = 'mr:challengeDescriptionsSeen'

/**
 * Challenges whose description the mapper has demonstrably read this session - either by
 * being on the challenge page, or by ticking the confirmation on the task entry gate.
 *
 * Session-scoped on purpose: it survives reloads and in-app navigation (so a mapper working
 * through a challenge is asked once), but a fresh session starts clean. Kept in memory as
 * well so it still works where sessionStorage is unavailable (private windows, embeds).
 */
const seenInMemory = new Set<number>()

const readStored = (): number[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is number => typeof id === 'number') : []
  } catch (error) {
    logger.warn('Could not read seen challenge descriptions', { error })
    return []
  }
}

export const hasSeenChallengeDescription = (challengeId: number | undefined): boolean => {
  if (challengeId === undefined) return false
  return seenInMemory.has(challengeId) || readStored().includes(challengeId)
}

export const markChallengeDescriptionSeen = (challengeId: number | undefined): void => {
  if (challengeId === undefined) return
  seenInMemory.add(challengeId)
  try {
    const stored = readStored()
    if (stored.includes(challengeId)) return
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...stored, challengeId]))
  } catch (error) {
    logger.warn('Could not record seen challenge description', { error, challengeId })
  }
}

/** Test seam: drops the in-memory half of the record. */
export const resetSeenChallengeDescriptions = (): void => {
  seenInMemory.clear()
}
