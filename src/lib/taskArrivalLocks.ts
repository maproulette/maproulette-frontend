import { z } from 'zod'
import { sessionStored } from '@/lib/storage'

/** How many tasks to remember before dropping the ones visited longest ago. */
const MAX_ENTRIES = 200

const TaskArrivalLocks = z.object({
  /** They already held this task's lock when they got here. */
  heldThis: z.boolean(),
  /** They already held a lock on a sibling task in the same challenge. */
  heldInChallenge: z.boolean(),
})

export type TaskArrivalLocks = z.infer<typeof TaskArrivalLocks>

/**
 * Locks as they stood the first time the mapper opened each task, this session.
 *
 * Recorded once and then read back, because the live picture stops being able to answer the
 * question: the moment the mapper takes this task's lock they hold it, and nothing in the
 * lock list distinguishes "was already working this" from "just clicked lock". Keeping the
 * arrival verdict means a lock taken here - or a reload afterwards - can't rewrite history.
 *
 * Session-scoped, like the seen-description record: it survives reloads and in-app
 * navigation, and a fresh session starts clean.
 */
const recorded = sessionStored(
  'taskArrivalLocks',
  z.array(TaskArrivalLocks.extend({ id: z.number() })),
  []
)

export const getTaskArrivalLocks = (taskId: number): TaskArrivalLocks | null => {
  const entry = recorded.get().find((entry) => entry.id === taskId)
  if (!entry) return null
  const { id: _id, ...locks } = entry
  return locks
}

/** Records the arrival verdict for a task. The first record for a task wins. */
export const recordTaskArrivalLocks = (taskId: number, locks: TaskArrivalLocks): void => {
  const entries = recorded.get()
  if (entries.some((entry) => entry.id === taskId)) return
  recorded.set([...entries, { id: taskId, ...locks }].slice(-MAX_ENTRIES))
}
