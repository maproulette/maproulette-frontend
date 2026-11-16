import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PRIORITY_FILTER,
  DEFAULT_TASK_STATUS_FILTER,
  metaReviewStatusesForApi,
} from './challengeTaskTableSearch.ts'

describe('DEFAULT_TASK_STATUS_FILTER', () => {
  it('contains the default set of task status ids', () => {
    expect(DEFAULT_TASK_STATUS_FILTER).toEqual([0, 1, 2, 3, 4, 5, 6, 9])
  })
})

describe('DEFAULT_PRIORITY_FILTER', () => {
  it('contains the default set of priority ids', () => {
    expect(DEFAULT_PRIORITY_FILTER).toEqual([0, 1, 2])
  })
})

describe('metaReviewStatusesForApi', () => {
  it.each([
    [
      'returns the meta review statuses unchanged when review statuses do not include -1',
      [1, 2],
      [3, 4],
      [3, 4],
    ],
    [
      'appends -1 when review statuses include -1 and meta statuses do not',
      [-1, 1],
      [3, 4],
      [3, 4, -1],
    ],
    ['does not duplicate -1 when meta statuses already include it', [-1], [-1, 2], [-1, 2]],
    ['returns an empty array when both inputs are empty', [], [], []],
  ] as [string, number[], number[], number[]][])(
    '%s',
    (_label, reviewStatuses, metaStatuses, expected) => {
      expect(metaReviewStatusesForApi(reviewStatuses, metaStatuses)).toEqual(expected)
    }
  )

  it('does not mutate the input meta review statuses array', () => {
    const meta = [2]
    metaReviewStatusesForApi([-1], meta)
    expect(meta).toEqual([2])
  })
})
