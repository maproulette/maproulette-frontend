import { logger } from '@/lib/logger'

const STORAGE_KEY = 'mr:taskArrivalLocks'

/** How many tasks to remember before dropping the ones visited longest ago. */
const MAX_ENTRIES = 200

/** What the mapper held the first time they landed on a task, this session. */
export interface TaskArrivalLocks {
  /** They already held this task's lock when they got here. */
  heldThis: boolean
  /** They already held a lock on a sibling task in the same challenge. */
  heldInChallenge: boolean
}

interface StoredEntry extends TaskArrivalLocks {
  id: number
}

/**
 * Locks as they stood the first time the mapper opened each task, this session.
 *
 * Recorded once and then read back, because the live picture stops being able to answer the
 * question: the moment the mapper takes this task's lock they hold it, and nothing in the
 * lock list distinguishes "was already working this" from "just clicked lock". Keeping the
 * arrival verdict means a lock taken here - or a reload afterwards - can't rewrite history.
 *
 * Session-scoped, like the seen-description record: it survives reloads and in-app
 * navigation, and a fresh session starts clean. Held in memory as well so it still works
 * where sessionStorage is unavailable (private windows, embeds).
 */
const recordedInMemory = new Map<number, TaskArrivalLocks>()

const readStored = (): StoredEntry[] => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (entry): entry is StoredEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as StoredEntry).id === 'number' &&
        typeof (entry as StoredEntry).heldThis === 'boolean' &&
        typeof (entry as StoredEntry).heldInChallenge === 'boolean'
    )
  } catch (error) {
    logger.warn('Could not read task arrival locks', { error })
    return []
  }
}

export const getTaskArrivalLocks = (taskId: number): TaskArrivalLocks | null => {
  const remembered = recordedInMemory.get(taskId)
  if (remembered) return remembered

  const stored = readStored().find((entry) => entry.id === taskId)
  if (!stored) return null

  const { id: _id, ...locks } = stored
  recordedInMemory.set(taskId, locks)
  return locks
}

/** Records the arrival verdict for a task. The first record for a task wins. */
export const recordTaskArrivalLocks = (taskId: number, locks: TaskArrivalLocks): void => {
  if (getTaskArrivalLocks(taskId)) return
  recordedInMemory.set(taskId, locks)

  try {
    const stored = readStored().filter((entry) => entry.id !== taskId)
    stored.push({ id: taskId, ...locks })
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored.slice(-MAX_ENTRIES)))
  } catch (error) {
    logger.warn('Could not record task arrival locks', { error, taskId })
  }
}

/** Test seam: drops the in-memory half of the record. */
export const resetTaskArrivalLocks = (): void => {
  recordedInMemory.clear()
}
