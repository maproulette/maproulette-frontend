import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Challenge } from '@/types/Challenge'
import type { Task } from '@/types/Task'

const setShortUrl = (value: string | undefined) => {
  ;(window.env as unknown as Record<string, string | undefined>).VITE_SHORT_URL = value
}

const loadModule = async () => {
  vi.resetModules()
  return import('./changesetComment.ts')
}

const makeChallenge = (props: Partial<Challenge> = {}): Challenge =>
  ({
    id: 49104,
    enabled: true,
    checkinComment: 'Fixed via MapRoulette',
    ...props,
  }) as Challenge

const makeTask = (id: number, properties: Record<string, unknown> = {}): Task =>
  ({
    id,
    geometries: { type: 'FeatureCollection', features: [{ type: 'Feature', properties }] },
  }) as unknown as Task

afterEach(() => {
  setShortUrl(undefined)
})

describe('taskShortLink', () => {
  it('returns null when no short-URL host is configured', async () => {
    setShortUrl(undefined)
    const { taskShortLink } = await loadModule()
    expect(taskShortLink(49104, 248076410)).toBeNull()
  })

  it('builds a short link when VITE_SHORT_URL is configured', async () => {
    setShortUrl('https://mpr.lt')
    const { taskShortLink } = await loadModule()
    expect(taskShortLink(49104, 248076410)).toBe('https://mpr.lt/c/49104/t/248076410')
  })
})

describe('buildChangesetComment', () => {
  it('appends the beta hashtag when absent', async () => {
    setShortUrl(undefined)
    const { buildChangesetComment } = await loadModule()
    const challenge = makeChallenge({ checkinComment: 'Fixed via MapRoulette' })
    expect(buildChangesetComment(challenge, makeTask(1))).toBe(
      'Fixed via MapRoulette #maproulette-beta'
    )
  })

  it('does not duplicate the beta hashtag when already present', async () => {
    setShortUrl(undefined)
    const { buildChangesetComment } = await loadModule()
    const challenge = makeChallenge({ checkinComment: 'Fixed via MapRoulette #maproulette-beta' })
    expect(buildChangesetComment(challenge, makeTask(1))).toBe(
      'Fixed via MapRoulette #maproulette-beta'
    )
  })

  it('includes the short link when the challenge is enabled and a short URL host is configured', async () => {
    setShortUrl('https://mpr.lt')
    const { buildChangesetComment } = await loadModule()
    const challenge = makeChallenge({
      enabled: true,
      id: 49104,
      checkinComment: 'Fixed via MapRoulette',
    })
    expect(buildChangesetComment(challenge, makeTask(248076410))).toBe(
      'Fixed via MapRoulette https://mpr.lt/c/49104/t/248076410 #maproulette-beta'
    )
  })

  it('omits the short link when the challenge is disabled', async () => {
    setShortUrl('https://mpr.lt')
    const { buildChangesetComment } = await loadModule()
    const challenge = makeChallenge({ enabled: false, checkinComment: 'Fixed via MapRoulette' })
    expect(buildChangesetComment(challenge, makeTask(1))).toBe(
      'Fixed via MapRoulette #maproulette-beta'
    )
  })

  it('omits the short link when VITE_SHORT_URL is not configured, even if enabled', async () => {
    setShortUrl(undefined)
    const { buildChangesetComment } = await loadModule()
    const challenge = makeChallenge({ enabled: true, checkinComment: 'Fixed via MapRoulette' })
    expect(buildChangesetComment(challenge, makeTask(1))).toBe(
      'Fixed via MapRoulette #maproulette-beta'
    )
  })

  it('trims whitespace from the resulting comment', async () => {
    setShortUrl(undefined)
    const { buildChangesetComment } = await loadModule()
    const challenge = makeChallenge({ checkinComment: '  Fixed via MapRoulette  ' })
    expect(buildChangesetComment(challenge, makeTask(1))).toBe(
      'Fixed via MapRoulette #maproulette-beta'
    )
  })

  it('fills in mustache tags from the task properties', async () => {
    setShortUrl(undefined)
    const { buildChangesetComment } = await loadModule()
    const challenge = makeChallenge({
      checkinComment: 'Expanded abbreviations in street name "{{name}}" #maproulette',
    })
    expect(buildChangesetComment(challenge, makeTask(1, { name: 'NE 14th St' }))).toBe(
      'Expanded abbreviations in street name "NE 14th St" #maproulette #maproulette-beta'
    )
  })
})
