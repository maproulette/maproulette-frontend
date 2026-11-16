import { describe, expect, it } from 'vitest'
import type { Challenge } from '@/types/Challenge'
import type { Project } from '@/types/Project'
import {
  challengeDescriptionText,
  projectDescriptionText,
  shouldRecommendDescription,
} from './descriptionRecommendation'

const challenge = (fields: Partial<Challenge>) => fields as Challenge

describe('challengeDescriptionText', () => {
  it('prefers the description, then the blurb, then the instruction', () => {
    expect(
      challengeDescriptionText(
        challenge({ description: 'Long form', blurb: 'Teaser', instruction: 'Brief' })
      )
    ).toBe('Long form')
    expect(challengeDescriptionText(challenge({ blurb: 'Teaser', instruction: 'Brief' }))).toBe(
      'Teaser'
    )
    expect(challengeDescriptionText(challenge({ instruction: 'Brief' }))).toBe('Brief')
  })

  it('skips fields that are present but blank', () => {
    expect(
      challengeDescriptionText(challenge({ description: '   ', blurb: '', instruction: 'Brief' }))
    ).toBe('Brief')
  })

  it('returns an empty string when there is nothing written and when there is no challenge', () => {
    expect(challengeDescriptionText(challenge({}))).toBe('')
    expect(challengeDescriptionText(null)).toBe('')
    expect(challengeDescriptionText(undefined)).toBe('')
  })
})

describe('projectDescriptionText', () => {
  it('trims the description and tolerates a missing project', () => {
    expect(projectDescriptionText({ description: '  About this project ' } as Project)).toBe(
      'About this project'
    )
    expect(projectDescriptionText({ description: '   ' } as Project)).toBe('')
    expect(projectDescriptionText(undefined)).toBe('')
  })
})

describe('shouldRecommendDescription', () => {
  const unread = {
    description: 'Read me',
    challengeSeen: false,
    holdsThisLock: false,
    holdsLockInChallenge: false,
  }

  it('recommends it to a mapper with no history with the challenge', () => {
    expect(shouldRecommendDescription(unread)).toBe(true)
  })

  it('drops the nudge once the challenge has been seen this session', () => {
    expect(shouldRecommendDescription({ ...unread, challengeSeen: true })).toBe(false)
  })

  it('drops the nudge for a task whose lock the mapper already holds', () => {
    expect(shouldRecommendDescription({ ...unread, holdsThisLock: true })).toBe(false)
  })

  it('drops the nudge when they hold a lock elsewhere in the same challenge', () => {
    expect(shouldRecommendDescription({ ...unread, holdsLockInChallenge: true })).toBe(false)
  })

  it('never nudges towards a challenge with nothing written about it', () => {
    expect(shouldRecommendDescription({ ...unread, description: '' })).toBe(false)
  })
})
