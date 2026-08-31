import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '@/api'
import { useChallengeContext } from '@/components/Pages/TaskEditPage/contexts/ChallengeContext'
import {
  challengeDescriptionText,
  shouldRecommendDescription,
} from '@/components/Pages/TaskEditPage/contexts/descriptionRecommendation'
import { useTaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { useAuthContext } from '@/contexts/AuthContext'
import {
  hasSeenChallengeDescription,
  markChallengeDescriptionSeen,
} from '@/lib/challengeDescriptionSeen'
import {
  getTaskArrivalLocks,
  recordTaskArrivalLocks,
  type TaskArrivalLocks,
} from '@/lib/taskArrivalLocks'

interface Arrival extends TaskArrivalLocks {
  taskId: number
}

const arrivalFromRecord = (taskId: number): Arrival | null => {
  const recorded = getTaskArrivalLocks(taskId)
  return recorded ? { taskId, ...recorded } : null
}

/**
 * Whether this mapper should be pointed at the challenge description, and the means to stop
 * pointing. True when they reached the task without ever being somewhere the description was
 * shown - straight from the dashboard task roulette or a shared link, rather than through the
 * challenge page - and they weren't already working in the challenge.
 *
 * Everything here turns on the mapper's locks *as they stood on arrival*. Taking this task's
 * lock from here is not evidence they read anything, so the two things that could rewrite the
 * snapshot afterwards are both headed off: this task's own lock is read during the first
 * render, before any lock this page takes can have come back, and the verdict is kept for the
 * session so a reload can't recompute it from a lock the mapper has since taken.
 */
export const useDescriptionRecommendation = () => {
  const { challenge } = useChallengeContext()
  const { task } = useTaskContext()
  const { user } = useAuthContext()
  const { data: heldLocks } = api.user.lockedTasks(user?.id)

  const [challengeSeen, setChallengeSeen] = useState(() =>
    hasSeenChallengeDescription(challenge?.id)
  )
  const [arrival, setArrival] = useState<Arrival | null>(() => arrivalFromRecord(task.id))

  // Did this task's lock already belong to the mapper as the page first rendered it? Read
  // during render rather than from an effect or the lock list: a lock taken from this page
  // can only land after a round trip, so the first render is always the pre-lock picture.
  // Held off until the user is known, which is likewise always before any lock of theirs.
  const heldThisOnArrival = useRef<{ taskId: number; held: boolean } | null>(null)
  if (user && heldThisOnArrival.current?.taskId !== task.id) {
    heldThisOnArrival.current = {
      taskId: task.id,
      held: task.lockedBy != null && task.lockedBy === user.id,
    }
  }

  useEffect(() => {
    setChallengeSeen(hasSeenChallengeDescription(challenge?.id))
  }, [challenge?.id])

  // A verdict already recorded for this task wins outright - it was taken on arrival, and
  // the lock list can no longer reconstruct it.
  useEffect(() => {
    setArrival((previous) => (previous?.taskId === task.id ? previous : arrivalFromRecord(task.id)))
  }, [task.id])

  useEffect(() => {
    if (!heldLocks || arrival?.taskId === task.id) return

    const onArrival = heldThisOnArrival.current
    if (onArrival?.taskId !== task.id) return

    const locks: TaskArrivalLocks = {
      heldThis: onArrival.held,
      // Sibling locks can only be read from the list, so this half is best-effort: if the
      // list only lands after the mapper locked here, one-lock-per-user has already released
      // any sibling and it reads as none. That errs towards nudging, which is the safe way
      // for it to be wrong.
      heldInChallenge: heldLocks.some(
        (locked) => locked.parent === task.parent && locked.id !== task.id
      ),
    }
    recordTaskArrivalLocks(task.id, locks)
    setArrival({ taskId: task.id, ...locks })
  }, [heldLocks, arrival?.taskId, task.id, task.parent])

  // Arrival locks are still unknown: say nothing rather than nudge and then take it back.
  const recommended =
    arrival?.taskId === task.id &&
    shouldRecommendDescription({
      description: challengeDescriptionText(challenge),
      challengeSeen,
      holdsThisLock: arrival.heldThis,
      holdsLockInChallenge: arrival.heldInChallenge,
    })

  const markDescriptionRead = useCallback(() => {
    markChallengeDescriptionSeen(challenge?.id)
    setChallengeSeen(true)
  }, [challenge?.id])

  return { recommended, markDescriptionRead }
}
