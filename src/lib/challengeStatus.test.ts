import { describe, expect, it } from 'vitest'
import {
  CHALLENGE_STATUS_BUILDING,
  CHALLENGE_STATUS_DELETING_TASKS,
  CHALLENGE_STATUS_FAILED,
  CHALLENGE_STATUS_FINISHED,
  CHALLENGE_STATUS_NONE,
  CHALLENGE_STATUS_PARTIALLY_LOADED,
  CHALLENGE_STATUS_READY,
  isChallengeComplete,
} from './challengeStatus'

describe('challenge status ids', () => {
  it('mirrors the backend Challenge.STATUS_* values', () => {
    expect([
      CHALLENGE_STATUS_NONE,
      CHALLENGE_STATUS_BUILDING,
      CHALLENGE_STATUS_FAILED,
      CHALLENGE_STATUS_READY,
      CHALLENGE_STATUS_PARTIALLY_LOADED,
      CHALLENGE_STATUS_FINISHED,
      CHALLENGE_STATUS_DELETING_TASKS,
    ]).toEqual([0, 1, 2, 3, 4, 5, 6])
  })
})

describe('isChallengeComplete', () => {
  it('is complete when the backend has flipped the challenge to FINISHED', () => {
    expect(
      isChallengeComplete({ status: CHALLENGE_STATUS_FINISHED, completionPercentage: 12 })
    ).toBe(true)
  })

  it('is complete when the challenge reports 100%, even if the status lags behind', () => {
    expect(isChallengeComplete({ status: CHALLENGE_STATUS_READY, completionPercentage: 100 })).toBe(
      true
    )
  })

  it('prefers the caller-supplied percentage over the challenge field', () => {
    expect(
      isChallengeComplete({ status: CHALLENGE_STATUS_READY, completionPercentage: 100 }, 40)
    ).toBe(false)
    expect(
      isChallengeComplete({ status: CHALLENGE_STATUS_READY, completionPercentage: 0 }, 100)
    ).toBe(true)
  })

  it('is incomplete for a partially-done challenge', () => {
    expect(isChallengeComplete({ status: CHALLENGE_STATUS_READY, completionPercentage: 99 })).toBe(
      false
    )
  })

  it('treats a missing percentage as zero', () => {
    expect(isChallengeComplete({ status: CHALLENGE_STATUS_BUILDING })).toBe(false)
    expect(
      isChallengeComplete({ status: CHALLENGE_STATUS_BUILDING, completionPercentage: null })
    ).toBe(false)
  })
})
