import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  savedCategorizationKeywords,
  withCategorizationKeywords,
} from './categorizationKeywords.ts'

describe('savedCategorizationKeywords', () => {
  it('reads the keywords MapRoulette 3 saved', () => {
    expect(
      savedCategorizationKeywords({
        mr3Frontend: { settings: { categorizationKeys: ['import', 'buildings'] } },
      })
    ).toEqual(['import', 'buildings'])
  })

  it('returns nothing when no keywords are saved', () => {
    expect(savedCategorizationKeywords(undefined)).toEqual([])
    expect(savedCategorizationKeywords({ mr3Frontend: { settings: {} } })).toEqual([])
  })

  it('ignores values that are not strings', () => {
    expect(
      savedCategorizationKeywords({
        mr3Frontend: { settings: { categorizationKeys: ['import', 4, null] } },
      })
    ).toEqual(['import'])
  })
})

describe('withCategorizationKeywords', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('replaces the keywords and keeps the other settings and apps', () => {
    const now = new Date('2026-11-09T00:00:00Z')
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const properties = withCategorizationKeywords(
      {
        maproulette: { settings: { acknowledgedNotices: ['a'] } },
        mr3Frontend: { meta: { revision: 1 }, settings: { categorizationKeys: ['old'], x: 1 } },
      },
      ['new']
    )
    expect(properties).toEqual({
      maproulette: { settings: { acknowledgedNotices: ['a'] } },
      mr3Frontend: {
        meta: { revision: now.getTime() },
        settings: { categorizationKeys: ['new'], x: 1 },
      },
    })
  })
})
