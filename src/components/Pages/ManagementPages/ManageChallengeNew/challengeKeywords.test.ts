import { describe, expect, it } from 'vitest'
import {
  buildChallengeTags,
  categoryMatchingKeywords,
  splitChallengeKeywords,
} from './challengeKeywords'

describe('categoryMatchingKeywords', () => {
  it('returns the first category with a matching keyword', () => {
    expect(categoryMatchingKeywords(['leisure', 'railway'])).toBe('pointsOfInterest')
  })

  it('falls back to other when no keyword matches a category', () => {
    expect(categoryMatchingKeywords(['sidewalks'])).toBe('other')
    expect(categoryMatchingKeywords([])).toBe('other')
  })
})

describe('splitChallengeKeywords', () => {
  it('separates category keywords from the rest and drops empty tags', () => {
    expect(splitChallengeKeywords(['natural', '', 'water', 'lakes'])).toEqual({
      category: 'water',
      additionalKeywords: 'lakes',
    })
  })

  it('treats missing tags as the other category with no keywords', () => {
    expect(splitChallengeKeywords(undefined)).toEqual({ category: 'other', additionalKeywords: '' })
  })
})

describe('buildChallengeTags', () => {
  it('combines the category keywords with comma-separated additional keywords', () => {
    expect(buildChallengeTags('transit', 'bus,,tram,')).toEqual([
      'railway',
      'public_transport',
      'bus',
      'tram',
    ])
  })

  it('returns only the additional keywords for the other category', () => {
    expect(buildChallengeTags('other', undefined)).toEqual([])
  })
})
