/** Task statuses, as numbered by the server. */
export const TASK_STATUS = {
  created: 0,
  fixed: 1,
  falsePositive: 2,
  skipped: 3,
  deleted: 4,
  alreadyFixed: 5,
  tooHard: 6,
  disabled: 9,
} as const

/**
 * Statuses a task in the given status is allowed to move to, mirroring
 * maproulette3's `allowedStatusProgressions`.
 *
 * Completed work is not re-openable — `fixed` and `alreadyFixed` are final —
 * with one exception: a task flagged `falsePositive` can still be corrected to
 * `fixed`, because being told something is not an issue is exactly the kind of
 * call that turns out to be wrong.
 */
export const allowedStatusProgressions = (status: number, includeSelf = false): Set<number> => {
  let progressions: Set<number>

  switch (status) {
    case TASK_STATUS.created:
      progressions = new Set([
        TASK_STATUS.fixed,
        TASK_STATUS.falsePositive,
        TASK_STATUS.skipped,
        TASK_STATUS.deleted,
        TASK_STATUS.alreadyFixed,
        TASK_STATUS.tooHard,
        TASK_STATUS.disabled,
      ])
      break
    case TASK_STATUS.falsePositive:
      progressions = new Set([TASK_STATUS.fixed])
      break
    case TASK_STATUS.skipped:
    case TASK_STATUS.tooHard:
      progressions = new Set([
        TASK_STATUS.fixed,
        TASK_STATUS.falsePositive,
        TASK_STATUS.skipped,
        TASK_STATUS.alreadyFixed,
        TASK_STATUS.tooHard,
      ])
      break
    case TASK_STATUS.deleted:
      progressions = new Set([TASK_STATUS.created, TASK_STATUS.disabled])
      break
    case TASK_STATUS.disabled:
      progressions = new Set([TASK_STATUS.created, TASK_STATUS.deleted])
      break
    case TASK_STATUS.fixed:
    case TASK_STATUS.alreadyFixed:
      progressions = new Set()
      break
    default:
      // An unrecognised status offers nothing rather than throwing: a task the
      // frontend does not understand should not take the whole page down.
      progressions = new Set()
  }

  if (includeSelf) progressions.add(status)
  return progressions
}

/** Whether a status represents finished work. */
export const isFinalStatus = (status: number): boolean =>
  status === TASK_STATUS.fixed ||
  status === TASK_STATUS.alreadyFixed ||
  status === TASK_STATUS.falsePositive
