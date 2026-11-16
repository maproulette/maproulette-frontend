/** Aligns with maproulette3 WithFilterCriteria DEFAULT_CRITERIA.filters */

export const DEFAULT_TASK_STATUS_FILTER = [0, 1, 2, 3, 4, 5, 6, 9] as const

export const DEFAULT_PRIORITY_FILTER = [0, 1, 2] as const

/** Mirrors maproulette3 generateSearchParametersString metaReviewStatus handling */
export const metaReviewStatusesForApi = (
  reviewStatuses: number[],
  metaReviewStatuses: number[]
): number[] => {
  const meta = [...metaReviewStatuses]
  if (reviewStatuses.includes(-1) && !meta.includes(-1)) {
    meta.push(-1)
  }
  return meta
}
