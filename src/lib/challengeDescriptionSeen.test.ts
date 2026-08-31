// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import {
  hasSeenChallengeDescription,
  markChallengeDescriptionSeen,
  resetSeenChallengeDescriptions,
} from './challengeDescriptionSeen'

beforeEach(() => {
  sessionStorage.clear()
  resetSeenChallengeDescriptions()
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
})
