import { describe, expect, it } from 'vitest'
import { challengeComments } from './comments'
import { challengeExplore } from './explore'
import { challengeExports } from './exports'
import { challengeFavorites } from './favorites'
import { challenge } from './index'
import { challengeLikes } from './likes'
import { challengeReports } from './reports'
import { challengeSingle } from './single'

describe('challenge', () => {
  it('merges every source module without any member being overwritten', () => {
    const sources = {
      ...challengeExports,
      ...challengeSingle,
      ...challengeExplore,
      ...challengeFavorites,
      ...challengeLikes,
      ...challengeComments,
      ...challengeReports,
    }

    expect(Object.keys(challenge).sort()).toEqual(Object.keys(sources).sort())
    for (const key of Object.keys(sources)) {
      expect(challenge[key as keyof typeof challenge]).toBe(sources[key as keyof typeof sources])
    }
  })

  it('re-exports every member of challengeExports by identity', () => {
    for (const [key, value] of Object.entries(challengeExports)) {
      expect(challenge[key as keyof typeof challenge]).toBe(value)
    }
  })

  it('re-exports every member of challengeSingle by identity', () => {
    for (const [key, value] of Object.entries(challengeSingle)) {
      expect(challenge[key as keyof typeof challenge]).toBe(value)
    }
  })

  it('re-exports every member of challengeExplore by identity', () => {
    for (const [key, value] of Object.entries(challengeExplore)) {
      expect(challenge[key as keyof typeof challenge]).toBe(value)
    }
  })

  it('re-exports every member of challengeFavorites by identity', () => {
    for (const [key, value] of Object.entries(challengeFavorites)) {
      expect(challenge[key as keyof typeof challenge]).toBe(value)
    }
  })

  it('re-exports every member of challengeLikes by identity', () => {
    for (const [key, value] of Object.entries(challengeLikes)) {
      expect(challenge[key as keyof typeof challenge]).toBe(value)
    }
  })

  it('re-exports every member of challengeComments by identity', () => {
    for (const [key, value] of Object.entries(challengeComments)) {
      expect(challenge[key as keyof typeof challenge]).toBe(value)
    }
  })

  it('re-exports every member of challengeReports by identity', () => {
    for (const [key, value] of Object.entries(challengeReports)) {
      expect(challenge[key as keyof typeof challenge]).toBe(value)
    }
  })

  it('has no key collisions between the merged source modules', () => {
    const keySets = [
      Object.keys(challengeSingle),
      Object.keys(challengeExplore),
      Object.keys(challengeFavorites),
      Object.keys(challengeLikes),
      Object.keys(challengeComments),
      Object.keys(challengeReports),
    ]
    const allKeys = keySets.flat()
    const uniqueKeys = new Set(allKeys)
    expect(uniqueKeys.size).toBe(allKeys.length)
  })
})
