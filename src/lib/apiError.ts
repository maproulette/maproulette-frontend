import { HTTPError } from 'ky'

/**
 * Extracts the backend's `{status: "KO", message: "..."}` error body from a
 * failed ky request, if present.
 */
export const getApiErrorMessage = async (error: unknown): Promise<string | undefined> => {
  if (!(error instanceof HTTPError)) return undefined

  try {
    const body = await error.response.json()
    return typeof body?.message === 'string' ? body.message : undefined
  } catch {
    return undefined
  }
}

/** The lock a user already holds elsewhere, as returned by a 409 lock-conflict response. */
export interface LockConflictInfo {
  lockedTaskId: number
  parentName?: string | null
  bundledTasks?: number[] | null
  startedAt?: string | null
  message?: string
}

/**
 * Extracts the `{status: "Conflict", lockedTaskId, ...}` body the backend sends when a
 * task/bundle lock request is rejected because the user already holds a different lock
 * (one active edit lock per user). Returns undefined for any other error, including a
 * plain 409 without a `lockedTaskId`.
 */
export const getLockConflictInfo = async (
  error: unknown
): Promise<LockConflictInfo | undefined> => {
  if (!(error instanceof HTTPError) || error.response.status !== 409) return undefined

  try {
    const body = await error.response.json()
    if (typeof body?.lockedTaskId !== 'number') return undefined
    return {
      lockedTaskId: body.lockedTaskId,
      parentName: body.parentName ?? null,
      bundledTasks: body.bundledTasks ?? null,
      startedAt: body.startedAt ?? null,
      message: typeof body.message === 'string' ? body.message : undefined,
    }
  } catch {
    return undefined
  }
}

/** Describes the lock a user already holds elsewhere, as returned on a 409 conflict. */
export interface LockConflict {
  lockedTaskId: number
  parentName?: string
  bundledTasks: number[]
  startedAt?: string
}

/**
 * A user may only hold one active edit lock at a time. Locking a task (or creating/updating
 * a bundle) while already holding a different lock returns 409 with details of that lock, so
 * the UI can offer to release it and retry. Returns undefined for any other kind of error.
 */
export const getLockConflict = async (error: unknown): Promise<LockConflict | undefined> => {
  const info = await getLockConflictInfo(error)
  if (!info) return undefined
  return {
    lockedTaskId: info.lockedTaskId,
    parentName: info.parentName ?? undefined,
    bundledTasks: info.bundledTasks ?? [],
    startedAt: info.startedAt ?? undefined,
  }
}
