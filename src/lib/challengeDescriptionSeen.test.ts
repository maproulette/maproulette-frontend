// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  hasSeenChallengeDescription,
  markChallengeDescriptionSeen,
} from './challengeDescriptionSeen'

beforeEach(() => {
  sessionStorage.clear()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('challenge description record', () => {
  it('remembers a challenge once marked', () => {
    expect(hasSeenChallengeDescription(7)).toBe(false)
    markChallengeDescriptionSeen(7)
    expect(hasSeenChallengeDescription(7)).toBe(true)
    expect(hasSeenChallengeDescription(8)).toBe(false)
  })

  it('keeps the record when a second challenge is added', () => {
    markChallengeDescriptionSeen(7)
    markChallengeDescriptionSeen(9)

    expect(hasSeenChallengeDescription(7)).toBe(true)
    expect(hasSeenChallengeDescription(9)).toBe(true)
  })

  it('ignores an undefined challenge either way', () => {
    markChallengeDescriptionSeen(undefined)
    expect(hasSeenChallengeDescription(undefined)).toBe(false)
  })

  it('does not rewrite storage for a challenge already recorded', () => {
    markChallengeDescriptionSeen(7)
    const setItem = vi.spyOn(sessionStorage, 'setItem')

    markChallengeDescriptionSeen(7)

    expect(setItem).not.toHaveBeenCalled()
    expect(hasSeenChallengeDescription(7)).toBe(true)
  })
})
