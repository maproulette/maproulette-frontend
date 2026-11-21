// @vitest-environment happy-dom
import { useQuery } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { Challenge } from '@/types/Challenge'
import {
  challengeTagsBatchOptions,
  invalidateChallengeAggregates,
  patchChallengeInCaches,
  patchChallengeTaskMarker,
  previewPrioritiesOptions,
  useArchiveChallenge,
  useCreateChallenge,
  usePauseChallenge,
  useRebuildChallenge,
  useRemoveChallengeKeywords,
  useUpdateChallenge,
  useUploadGeoJSON,
} from './single'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('patchChallengeTaskMarker', () => {
  it('does nothing when challengeId is falsy', () => {
    const queryClient = createTestQueryClient()
    const spy = vi.spyOn(queryClient, 'setQueryData')

    patchChallengeTaskMarker(queryClient, 0, 1, { status: 2 })

    expect(spy).not.toHaveBeenCalled()
  })

  it('leaves the cache untouched when nothing is cached for the challenge', () => {
    const queryClient = createTestQueryClient()

    patchChallengeTaskMarker(queryClient, 5, 1, { status: 2 })

    expect(queryClient.getQueryData(['challenge', 'taskMarkers', 5])).toBeUndefined()
  })

  it('leaves the cache untouched when the cached data has no markers', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 'taskMarkers', 5], { overlaps: [] })

    patchChallengeTaskMarker(queryClient, 5, 1, { status: 2 })

    expect(queryClient.getQueryData(['challenge', 'taskMarkers', 5])).toEqual({ overlaps: [] })
  })

  it('leaves the marker list untouched when the task id is not present', () => {
    const queryClient = createTestQueryClient()
    const initial = { markers: [{ id: 2, status: 0 }], overlaps: [] }
    queryClient.setQueryData(['challenge', 'taskMarkers', 5], initial)

    patchChallengeTaskMarker(queryClient, 5, 999, { status: 2 })

    expect(queryClient.getQueryData(['challenge', 'taskMarkers', 5])).toEqual(initial)
  })

  it('patches the matching marker in place', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 'taskMarkers', 5], {
      markers: [{ id: 1, status: 0, priority: 0, bundleId: null, lockedBy: null }],
      overlaps: [],
    })

    patchChallengeTaskMarker(queryClient, 5, 1, { status: 2, lockedBy: 42 })

    expect(queryClient.getQueryData(['challenge', 'taskMarkers', 5])).toEqual({
      markers: [{ id: 1, status: 2, priority: 0, bundleId: null, lockedBy: 42 }],
      overlaps: [],
    })
  })
})

describe('invalidateChallengeAggregates', () => {
  it('does nothing when challengeId is falsy', () => {
    const queryClient = createTestQueryClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    invalidateChallengeAggregates(queryClient, 0)

    expect(spy).not.toHaveBeenCalled()
  })

  it('invalidates the challenge, stats, and activity caches', () => {
    const queryClient = createTestQueryClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    invalidateChallengeAggregates(queryClient, 7)

    expect(spy).toHaveBeenCalledWith({ queryKey: ['challenge', 7] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['challenge', 'stats', 7] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['challenge', 'activity', 7] })
    expect(spy).toHaveBeenCalledTimes(4)
  })

  it('marks listing caches stale, leaving unrelated challenge caches alone', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 'exploreInfinite', {}, null], { pages: [[{ id: 7 }]] })
    queryClient.setQueryData(['project', 'challenges', 1], [{ id: 7 }])
    queryClient.setQueryData(['challenge', 99], { id: 99 })
    queryClient.setQueryData(['challenge', 'stats', 99], [])

    invalidateChallengeAggregates(queryClient, 7)

    const state = (key: unknown[]) => queryClient.getQueryState(key)
    expect(state(['challenge', 'exploreInfinite', {}, null])?.isInvalidated).toBe(true)
    expect(state(['project', 'challenges', 1])?.isInvalidated).toBe(true)
    expect(state(['challenge', 99])?.isInvalidated).toBe(false)
    expect(state(['challenge', 'stats', 99])?.isInvalidated).toBe(false)
  })
})

describe('getChallengeTagsBatch', () => {
  it('returns all tags from cache without fetching when every id is already cached', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 'tags', 1], [{ id: 1, name: 'tag-a' }])
    queryClient.setQueryData(['challenge', 'tags', 2], [{ id: 2, name: 'tag-b' }])

    const { result } = renderHook(() => useQuery(challengeTagsBatchOptions(queryClient, [1, 2])), {
      wrapper: queryClientWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(
      new Map([
        [1, [{ id: 1, name: 'tag-a' }]],
        [2, [{ id: 2, name: 'tag-b' }]],
      ])
    )
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches only the missing ids in a single request, merges with cache, and backfills the per-challenge cache', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ '2': [{ id: 9, name: 'tag-b' }] }), { status: 200 })
    )
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 'tags', 1], [{ id: 1, name: 'tag-a' }])

    const { result } = renderHook(() => useQuery(challengeTagsBatchOptions(queryClient, [1, 2])), {
      wrapper: queryClientWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(
      new Map([
        [1, [{ id: 1, name: 'tag-a' }]],
        [2, [{ id: 9, name: 'tag-b' }]],
      ])
    )
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect(url.pathname).toBe('/api/v2/challenges/tags/batch')
    expect(url.searchParams.get('challengeIds')).toBe('2')
    expect(queryClient.getQueryData(['challenge', 'tags', 2])).toEqual([{ id: 9, name: 'tag-b' }])
  })

  it('defaults to an empty tag list and caches it when the response omits a requested id', async () => {
    stubFetch(new Response(JSON.stringify({}), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useQuery(challengeTagsBatchOptions(queryClient, [3])), {
      wrapper: queryClientWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(new Map([[3, []]]))
    expect(queryClient.getQueryData(['challenge', 'tags', 3])).toEqual([])
  })
})

type ChallengeDraft = Omit<Partial<Challenge>, 'dataOriginDate'> & {
  localGeoJSON?: string
  dataOriginDate?: string
}

describe('useCreateChallenge', () => {
  it('applies defaults for omitted fields and omits extra keys when unset', async () => {
    const created = { id: 30, name: '' } as unknown as Challenge
    const fetchMock = stubFetch(new Response(JSON.stringify(created), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useCreateChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    const draft: ChallengeDraft = { id: 999 }
    result.current.mutate({ projectId: 1, challengeData: draft as unknown as Partial<Challenge> })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const body = await request.clone().json()
    expect(body).toEqual({
      parent: 1,
      name: '',
      description: '',
      instruction: '',
      difficulty: 2,
      enabled: true,
      featured: false,
      overpassQL: '',
      overpassTargetType: '',
    })
    expect(body).not.toHaveProperty('localGeoJSON')
    expect(body).not.toHaveProperty('dataOriginDate')
    expect(body).not.toHaveProperty('id')

    expect(queryClient.getQueryData(['challenge', 30])).toEqual(created)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['project', 'challenges', 1] })
  })

  it('passes through explicit values and extra fields when provided', async () => {
    const created = { id: 31 } as unknown as Challenge
    const fetchMock = stubFetch(new Response(JSON.stringify(created), { status: 200 }))

    const { result } = renderHook(() => useCreateChallenge(), {
      wrapper: queryClientWrapper(),
    })

    const draft: ChallengeDraft = {
      id: 5,
      name: 'My Challenge',
      description: 'Desc',
      instruction: 'Do it',
      difficulty: 1,
      enabled: false,
      featured: true,
      overpassQL: 'way[highway]',
      localGeoJSON: '{"type":"FeatureCollection","features":[]}',
      dataOriginDate: '2024-05-01',
    }
    result.current.mutate({ projectId: 2, challengeData: draft as unknown as Partial<Challenge> })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const body = await request.clone().json()
    expect(body).toEqual({
      parent: 2,
      name: 'My Challenge',
      description: 'Desc',
      instruction: 'Do it',
      difficulty: 1,
      enabled: false,
      featured: true,
      overpassQL: 'way[highway]',
      overpassTargetType: '',
      localGeoJSON: draft.localGeoJSON,
      dataOriginDate: draft.dataOriginDate,
    })
  })

  // A remote URL is the challenge's only task source: dropping it here leaves
  // the backend nothing to build tasks from, so the challenge comes up empty.
  it('sends the remote GeoJSON URL and the owning team so the backend can build from them', async () => {
    const created = { id: 32 } as unknown as Challenge
    const fetchMock = stubFetch(new Response(JSON.stringify(created), { status: 200 }))

    const { result } = renderHook(() => useCreateChallenge(), {
      wrapper: queryClientWrapper(),
    })

    const draft: ChallengeDraft = {
      name: 'Remote Challenge',
      remoteGeoJson: 'https://example.com/tasks.geojson',
      ownerTeamId: 7,
    }
    result.current.mutate({ projectId: 3, challengeData: draft as unknown as Partial<Challenge> })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const body = await request.clone().json()
    expect(body.remoteGeoJson).toBe('https://example.com/tasks.geojson')
    expect(body.ownerTeamId).toBe(7)
  })
})

describe('useRemoveChallengeKeywords', () => {
  it('DELETEs the comma-joined keywords from the challenge', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))
    const { result } = renderHook(() => useRemoveChallengeKeywords(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ challengeId: 4, keywords: ['roads', 'lanes'] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    const url = new URL(request.url)
    expect(url.pathname).toBe('/api/v2/challenge/4/tags')
    expect(url.searchParams.get('tags')).toBe('roads,lanes')
  })
})

describe('usePreviewPriorities', () => {
  it('falls back to an empty body when manually refetched with a null draft', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ priorities: {}, counts: { high: 0, medium: 0, low: 0 } }), {
        status: 200,
      })
    )

    const { result } = renderHook(() => useQuery(previewPrioritiesOptions(7, null)), {
      wrapper: queryClientWrapper(),
    })
    expect(result.current.fetchStatus).toBe('idle')

    result.current.refetch()

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    const [request] = fetchMock.mock.calls[0]
    const body = await request.clone().json()
    expect(body).toEqual({})
  })
})

describe('useUploadGeoJSON', () => {
  it('uploads a GeoJSON file with default options', async () => {
    const fetchMock = stubFetch(new Response('null', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUploadGeoJSON(), {
      wrapper: queryClientWrapper(queryClient),
    })

    const file = new File(['{"type":"FeatureCollection","features":[]}'], 'tasks.geojson', {
      type: 'application/geo+json',
    })
    result.current.mutate({ challengeId: 70, geoJSONFile: file })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    const url = new URL(request.url)
    expect(url.pathname).toContain('/api/v2/challenge/70/addFileTasks')
    expect(url.searchParams.get('lineByLine')).toBe('false')
    expect(url.searchParams.get('removeUnmatched')).toBe('false')
    expect(url.searchParams.get('skipSnapshot')).toBe('true')
    expect(url.searchParams.has('dataOriginDate')).toBe(false)

    const formData = await request.clone().formData()
    expect((formData.get('json') as File).name).toBe('tasks.geojson')

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'taskMarkers', 70] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'stats', 70] })
  })

  it('honors provided options including dataOriginDate', async () => {
    const fetchMock = stubFetch(new Response('null', { status: 200 }))

    const { result } = renderHook(() => useUploadGeoJSON(), {
      wrapper: queryClientWrapper(),
    })

    const file = new File(['{}'], 'tasks.geojson')
    result.current.mutate({
      challengeId: 71,
      geoJSONFile: file,
      options: {
        lineByLine: true,
        removeUnmatched: true,
        skipSnapshot: false,
        dataOriginDate: '2024-06-01',
      },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.searchParams.get('lineByLine')).toBe('true')
    expect(url.searchParams.get('removeUnmatched')).toBe('true')
    expect(url.searchParams.get('skipSnapshot')).toBe('false')
    expect(url.searchParams.get('dataOriginDate')).toBe('2024-06-01')
  })
})

describe('patchChallengeInCaches', () => {
  it('does nothing when challengeId is falsy', () => {
    const queryClient = createTestQueryClient()
    const spy = vi.spyOn(queryClient, 'setQueryData')

    patchChallengeInCaches(queryClient, 0, { paused: true })

    expect(spy).not.toHaveBeenCalled()
  })

  it('returns a rollback that is safe to call when there was nothing to patch', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 7], { id: 7, paused: false })

    const rollback = patchChallengeInCaches(queryClient, 0, { paused: true })
    rollback()

    expect(queryClient.getQueryData(['challenge', 7])).toEqual({ id: 7, paused: false })
  })

  it('leaves caches belonging to other parts of the app alone', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['user', 'whoami'], { id: 7, name: 'me' })

    patchChallengeInCaches(queryClient, 7, { paused: true })

    expect(queryClient.getQueryData(['user', 'whoami'])).toEqual({ id: 7, name: 'me' })
  })

  it('steps over cached payloads with nothing to patch', () => {
    const queryClient = createTestQueryClient()
    const listing = [null, 'not a challenge', { id: 8, paused: false }]
    const otherChallenge = { id: 8, paused: false }
    const otherPages = { pages: [[{ id: 8, paused: false }]], pageParams: [0] }
    queryClient.setQueryData(['challenge', 'listing', [1], { limit: 100 }], listing)
    queryClient.setQueryData(['challenge', 'search', 'sidewalks'], otherChallenge)
    queryClient.setQueryData(['challenge', 'exploreInfinite', {}, null], otherPages)
    queryClient.setQueryData(['challenge', 'explore', {}], 'unexpected payload')
    const setQueryData = vi.spyOn(queryClient, 'setQueryData')

    patchChallengeInCaches(queryClient, 7, { paused: true })

    expect(setQueryData).not.toHaveBeenCalled()
    expect(queryClient.getQueryData(['challenge', 'listing', [1], { limit: 100 }])).toBe(listing)
    expect(queryClient.getQueryData(['challenge', 'search', 'sidewalks'])).toBe(otherChallenge)
    expect(queryClient.getQueryData(['challenge', 'exploreInfinite', {}, null])).toBe(otherPages)
  })

  it('patches around unusable entries in a cached list', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      ['challenge', 'listing', [1], { limit: 100 }],
      [null, 'junk', { id: 7, paused: false }]
    )

    patchChallengeInCaches(queryClient, 7, { paused: true })

    expect(queryClient.getQueryData(['challenge', 'listing', [1], { limit: 100 }])).toEqual([
      null,
      'junk',
      { id: 7, paused: true },
    ])
  })

  it('patches the challenge in single, listing, infinite and project caches', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 7], { id: 7, name: 'seven', paused: false })
    queryClient.setQueryData(
      ['challenge', 'listing', [1], { limit: 100 }],
      [
        { id: 7, paused: false },
        { id: 8, paused: false },
      ]
    )
    queryClient.setQueryData(['challenge', 'exploreInfinite', {}, null], {
      pages: [[{ id: 7, paused: false }], [{ id: 9, paused: false }]],
      pageParams: [0, 10],
    })
    queryClient.setQueryData(
      ['project', 'challenges', 1, { limit: 100, page: 0 }],
      [{ id: 7, paused: false }]
    )

    patchChallengeInCaches(queryClient, 7, { paused: true })

    expect(queryClient.getQueryData(['challenge', 7])).toEqual({
      id: 7,
      name: 'seven',
      paused: true,
    })
    expect(queryClient.getQueryData(['challenge', 'listing', [1], { limit: 100 }])).toEqual([
      { id: 7, paused: true },
      { id: 8, paused: false },
    ])
    expect(queryClient.getQueryData(['challenge', 'exploreInfinite', {}, null])).toEqual({
      pages: [[{ id: 7, paused: true }], [{ id: 9, paused: false }]],
      pageParams: [0, 10],
    })
    expect(queryClient.getQueryData(['project', 'challenges', 1, { limit: 100, page: 0 }])).toEqual(
      [{ id: 7, paused: true }]
    )
  })

  it('leaves aggregate caches that carry their own id alone', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 'stats', 7], { id: 7, total: 3 })
    queryClient.setQueryData(['challenge', 7, 'isFavorited'], { id: 7, favorited: true })

    patchChallengeInCaches(queryClient, 7, { paused: true })

    expect(queryClient.getQueryData(['challenge', 'stats', 7])).toEqual({ id: 7, total: 3 })
    expect(queryClient.getQueryData(['challenge', 7, 'isFavorited'])).toEqual({
      id: 7,
      favorited: true,
    })
  })

  it('restores the pre-patch data when the returned rollback runs', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 7], { id: 7, paused: false })
    queryClient.setQueryData(
      ['challenge', 'listing', [1], { limit: 100 }],
      [{ id: 7, paused: false }]
    )

    const rollback = patchChallengeInCaches(queryClient, 7, { paused: true })
    rollback()

    expect(queryClient.getQueryData(['challenge', 7])).toEqual({ id: 7, paused: false })
    expect(queryClient.getQueryData(['challenge', 'listing', [1], { limit: 100 }])).toEqual([
      { id: 7, paused: false },
    ])
  })
})

describe('optimistic challenge toggles', () => {
  it('usePauseChallenge patches cached listings before the request resolves', async () => {
    let releaseResponse: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    const fetchMock = vi.fn(async (_request: Request) => {
      await pending
      return new Response(JSON.stringify({ id: 120, paused: true }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      ['challenge', 'listing', [1], { limit: 100 }],
      [{ id: 120, paused: false }]
    )

    const { result } = renderHook(() => usePauseChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ challengeId: 120, paused: true })

    await waitFor(() =>
      expect(queryClient.getQueryData(['challenge', 'listing', [1], { limit: 100 }])).toEqual([
        { id: 120, paused: true },
      ])
    )
    expect(result.current.isPending).toBe(true)

    releaseResponse()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('useArchiveChallenge rolls the cache back when the request fails', async () => {
    stubFetch(new Response('nope', { status: 500 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      ['challenge', 'listing', [1], { limit: 100 }],
      [{ id: 121, isArchived: false }]
    )

    const { result } = renderHook(() => useArchiveChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ challengeId: 121, isArchived: true })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(queryClient.getQueryData(['challenge', 'listing', [1], { limit: 100 }])).toEqual([
      { id: 121, isArchived: false },
    ])
  })

  it('useUpdateChallenge rolls the cache back when the request fails', async () => {
    stubFetch(new Response('nope', { status: 500 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 123], { id: 123, enabled: true })

    const { result } = renderHook(() => useUpdateChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ challengeId: 123, updates: { enabled: false } })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(queryClient.getQueryData(['challenge', 123])).toEqual({ id: 123, enabled: true })
  })

  it('usePauseChallenge rolls the cache back when the request fails', async () => {
    stubFetch(new Response('nope', { status: 500 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(
      ['challenge', 'listing', [1], { limit: 100 }],
      [{ id: 124, paused: false }]
    )

    const { result } = renderHook(() => usePauseChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ challengeId: 124, paused: true })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(queryClient.getQueryData(['challenge', 'listing', [1], { limit: 100 }])).toEqual([
      { id: 124, paused: false },
    ])
  })

  it('useUpdateChallenge patches the discoverable flag optimistically', async () => {
    let releaseResponse: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    const fetchMock = vi.fn(async (_request: Request) => {
      await pending
      return new Response(JSON.stringify({ id: 122, enabled: false }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 122], { id: 122, enabled: true })

    const { result } = renderHook(() => useUpdateChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ challengeId: 122, updates: { enabled: false } })

    await waitFor(() =>
      expect(queryClient.getQueryData(['challenge', 122])).toEqual({ id: 122, enabled: false })
    )

    releaseResponse()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })
})

describe('useRebuildChallenge', () => {
  it('rebuilds a challenge without extra search params when none are provided', async () => {
    const fetchMock = stubFetch(new Response('null', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRebuildChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ challengeId: 110 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    const url = new URL(request.url)
    expect(url.pathname).toContain('/api/v2/challenge/110/rebuild')
    expect([...url.searchParams.keys()]).toEqual([])

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 110] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['project', 'challenges'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'stats', 110] })
  })

  it('includes removeUnmatched and skipSnapshot when provided', async () => {
    const fetchMock = stubFetch(new Response('null', { status: 200 }))

    const { result } = renderHook(() => useRebuildChallenge(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ challengeId: 111, removeUnmatched: true, skipSnapshot: false })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.searchParams.get('removeUnmatched')).toBe('true')
    expect(url.searchParams.get('skipSnapshot')).toBe('false')
  })

  it('refreshes the challenge when the rebuild fails', async () => {
    stubFetch(new Response('{"status":"KO","message":"Overpass is busy"}', { status: 400 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useRebuildChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ challengeId: 112 })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 112] })
  })
})
