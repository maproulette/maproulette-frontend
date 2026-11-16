import { useCallback, useRef, useState } from 'react'
import { api } from '@/api'
import { getLockConflict, type LockConflict } from '@/lib/apiError'

/**
 * A user may only hold one active edit lock at a time. When an attempt to lock a task (or
 * create/update a bundle) fails with a 409 conflict, this captures the details of the lock the
 * user already holds elsewhere so a confirm-and-switch modal can be shown, then handles
 * releasing that lock and retrying the original action.
 */
export const useLockConflict = () => {
  const unlockTaskMutation = api.task.useUnlockTask()
  const [conflict, setConflict] = useState<LockConflict | null>(null)
  const pendingRetryRef = useRef<(() => void) | null>(null)

  /**
   * Call from a mutation's onError. If `error` is a lock conflict, stores it (triggering the
   * modal) and remembers `retry` to re-run once the user confirms. Returns whether it was
   * a lock conflict, so callers can fall back to normal error handling otherwise.
   */
  const handleError = useCallback(async (error: unknown, retry: () => void): Promise<boolean> => {
    const parsed = await getLockConflict(error)
    if (!parsed) return false
    setConflict(parsed)
    pendingRetryRef.current = retry
    return true
  }, [])

  const confirm = useCallback(() => {
    if (!conflict) return
    unlockTaskMutation.mutate(conflict.lockedTaskId, {
      onSuccess: () => {
        setConflict(null)
        const retry = pendingRetryRef.current
        pendingRetryRef.current = null
        retry?.()
      },
    })
  }, [conflict, unlockTaskMutation])

  const cancel = useCallback(() => {
    setConflict(null)
    pendingRetryRef.current = null
  }, [])

  return {
    conflict,
    handleError,
    confirm,
    cancel,
    isReleasing: unlockTaskMutation.isPending,
  }
}
