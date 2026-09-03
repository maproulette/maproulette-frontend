// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  hasSeenChallengeDescription,
  markChallengeDescriptionSeen,
  resetSeenChallengeDescriptions,
} from './challengeDescriptionSeen'

beforeEach(() => {
  sessionStorage.clear()
  resetSeenChallengeDescriptions()
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

  it('survives a reload - the record lives in sessionStorage', () => {
    markChallengeDescriptionSeen(7)
    resetSeenChallengeDescriptions() // as if the page were reloaded

    expect(hasSeenChallengeDescription(7)).toBe(true)
  })

  it('keeps the record when a second challenge is added', () => {
    markChallengeDescriptionSeen(7)
    markChallengeDescriptionSeen(9)
    resetSeenChallengeDescriptions()

    expect(hasSeenChallengeDescription(7)).toBe(true)
    expect(hasSeenChallengeDescription(9)).toBe(true)
  })

  it('ignores an undefined challenge either way', () => {
    markChallengeDescriptionSeen(undefined)
    expect(hasSeenChallengeDescription(undefined)).toBe(false)
  })

  it('recovers from junk in storage instead of throwing', () => {
    sessionStorage.setItem('mr:challengeDescriptionsSeen', '{not json')

    expect(hasSeenChallengeDescription(7)).toBe(false)
    markChallengeDescriptionSeen(7)
    expect(hasSeenChallengeDescription(7)).toBe(true)
  })

  it('ignores stored json that is not an array', () => {
    sessionStorage.setItem('mr:challengeDescriptionsSeen', '{"7":true}')

    expect(hasSeenChallengeDescription(7)).toBe(false)
  })

  it('ignores non-numeric ids inside the stored array', () => {
    sessionStorage.setItem('mr:challengeDescriptionsSeen', '["7", null, 9]')

    expect(hasSeenChallengeDescription(7)).toBe(false)
    expect(hasSeenChallengeDescription(9)).toBe(true)
  })

  it('does not rewrite storage for a challenge already recorded there', () => {
    markChallengeDescriptionSeen(7)
    resetSeenChallengeDescriptions() // as if the page were reloaded
    const setItem = vi.spyOn(sessionStorage, 'setItem')

    markChallengeDescriptionSeen(7)

    expect(setItem).not.toHaveBeenCalled()
    expect(hasSeenChallengeDescription(7)).toBe(true)
  })

  it('still remembers in memory when storage refuses the write', () => {
    vi.spyOn(sessionStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })

    markChallengeDescriptionSeen(7)

    expect(hasSeenChallengeDescription(7)).toBe(true)
  })
})
