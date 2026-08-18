// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type {
  Challenge,
  ChallengeActivityEntry,
  ChallengeGetResponse,
  ChallengeStatsResponse,
  ChallengeTaskMarkersResponse,
} from '@/types/Challenge'
import type { Task } from '@/types/Task'
import { challengeSingle, invalidateChallengeAggregates, patchChallengeTaskMarker } from './single'

afterEach(() => {
  vi.unstubAllGlobals()
})

function makePriorities(
  overrides: Partial<{
    defaultPriority: number
    highPriorityRule: string
    highPriorityBounds: string
    mediumPriorityRule: string
    mediumPriorityBounds: string
    lowPriorityRule: string
    lowPriorityBounds: string
  }> = {}
) {
  return {
    defaultPriority: 0,
    highPriorityRule: '',
    highPriorityBounds: '',
    mediumPriorityRule: '',
    mediumPriorityBounds: '',
    lowPriorityRule: '',
    lowPriorityBounds: '',
    ...overrides,
  }
}

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
    expect(spy).toHaveBeenCalledTimes(3)
  })
})

describe('challengeSingle.getChallenge', () => {
  it('fetches a challenge by id', async () => {
    stubFetch(new Response(JSON.stringify({ id: 1, name: 'Alpha' }), { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallenge(1), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ id: 1, name: 'Alpha' })
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallenge(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeSingle.getChallengeOptions', () => {
  it('builds queryOptions whose queryFn fetches the challenge', async () => {
    stubFetch(new Response(JSON.stringify({ id: 3, name: 'Beta' }), { status: 200 }))

    const options = challengeSingle.getChallengeOptions(3)
    expect(options.queryKey).toEqual(['challenge', 3])

    const data = await (options.queryFn as unknown as () => Promise<ChallengeGetResponse>)()
    expect(data).toEqual({ id: 3, name: 'Beta' })
  })
})

describe('challengeSingle.getChallengeTags', () => {
  it('fetches tags for a challenge', async () => {
    stubFetch(new Response(JSON.stringify([{ id: 1, name: 'tag-a' }]), { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallengeTags(4), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 1, name: 'tag-a' }])
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallengeTags(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeSingle.getChallengeTagsBatch', () => {
  it('returns all tags from cache without fetching when every id is already cached', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 'tags', 1], [{ id: 1, name: 'tag-a' }])
    queryClient.setQueryData(['challenge', 'tags', 2], [{ id: 2, name: 'tag-b' }])

    const { result } = renderHook(() => challengeSingle.getChallengeTagsBatch([1, 2]), {
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

    const { result } = renderHook(() => challengeSingle.getChallengeTagsBatch([1, 2]), {
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

    const { result } = renderHook(() => challengeSingle.getChallengeTagsBatch([3]), {
      wrapper: queryClientWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(new Map([[3, []]]))
    expect(queryClient.getQueryData(['challenge', 'tags', 3])).toEqual([])
  })

  it('is disabled when given an empty array of challenge ids', () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallengeTagsBatch([]), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeSingle.getChallengeStats', () => {
  it('fetches stats for a challenge', async () => {
    const stats = { actions: [] } as unknown as ChallengeStatsResponse
    stubFetch(new Response(JSON.stringify(stats), { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallengeStats(4), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(stats)
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallengeStats(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('is disabled when the enabled param is false, even with a valid challengeId', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallengeStats(4, false), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeSingle.getChallengeActivity', () => {
  it('fetches activity entries for a challenge', async () => {
    const activity: ChallengeActivityEntry[] = [
      { date: '2024-01-01', status: 1, statusName: 'Fixed', count: 3 },
    ]
    stubFetch(new Response(JSON.stringify(activity), { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallengeActivity(4), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(activity)
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallengeActivity(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeSingle.getChallengeTaskMarkersOptions', () => {
  it('builds queryOptions whose queryFn fetches task markers', async () => {
    const markers = { markers: [], overlaps: [] } as unknown as ChallengeTaskMarkersResponse
    stubFetch(new Response(JSON.stringify(markers), { status: 200 }))

    const options = challengeSingle.getChallengeTaskMarkersOptions(6)
    expect(options.queryKey).toEqual(['challenge', 'taskMarkers', 6])
    expect(options.enabled).toBe(true)

    const data = await (options.queryFn as unknown as () => Promise<ChallengeTaskMarkersResponse>)()
    expect(data).toEqual(markers)
  })

  it('is disabled when challengeId is falsy', () => {
    const options = challengeSingle.getChallengeTaskMarkersOptions(0)

    expect(options.enabled).toBe(false)
  })
})

describe('challengeSingle.getChallengeTaskMarkers', () => {
  it('fetches task markers for a challenge', async () => {
    const markers = {
      markers: [{ id: 1 }],
      overlaps: [],
    } as unknown as ChallengeTaskMarkersResponse
    stubFetch(new Response(JSON.stringify(markers), { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallengeTaskMarkers(6), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(markers)
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getChallengeTaskMarkers(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeSingle.getRandomTask', () => {
  it('fetches a random task and caches it', async () => {
    const tasks = [{ id: 11 }, { id: 22 }] as unknown as Task[]
    const fetchMock = stubFetch(new Response(JSON.stringify(tasks), { status: 200 }))
    const queryClient = createTestQueryClient()

    const result = await challengeSingle.getRandomTask(9, queryClient)

    expect(result).toEqual(tasks)
    expect(queryClient.getQueryData(['task', 11])).toEqual(tasks[0])
    expect(queryClient.getQueryData(['task', 22])).toEqual(tasks[1])

    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/challenge/9/tasks/random')
    expect(new URL(request.url).searchParams.get('limit')).toBe('1')
  })
})

describe('challengeSingle.fetchTasksNearby', () => {
  it('fetches nearby tasks using the default limit', async () => {
    const tasks = [{ id: 5 }] as unknown as Task[]
    const fetchMock = stubFetch(new Response(JSON.stringify(tasks), { status: 200 }))

    const result = await challengeSingle.fetchTasksNearby(9, 3)

    expect(result).toEqual(tasks)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/challenge/9/tasksNearby/3')
    const params = new URL(request.url).searchParams
    expect(params.get('excludeSelfLocked')).toBe('true')
    expect(params.get('limit')).toBe('5')
  })

  it('fetches nearby tasks using a custom limit', async () => {
    const tasks: Task[] = []
    const fetchMock = stubFetch(new Response(JSON.stringify(tasks), { status: 200 }))

    await challengeSingle.fetchTasksNearby(9, 3, 20)

    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).searchParams.get('limit')).toBe('20')
  })
})

describe('challengeSingle.getTasksNearby', () => {
  it('fetches nearby tasks and caches each one', async () => {
    const tasks = [{ id: 5 }, { id: 6 }] as unknown as Task[]
    stubFetch(new Response(JSON.stringify(tasks), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => challengeSingle.getTasksNearby(9, 3), {
      wrapper: queryClientWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(tasks)
    expect(queryClient.getQueryData(['task', 5])).toEqual(tasks[0])
    expect(queryClient.getQueryData(['task', 6])).toEqual(tasks[1])
  })

  it('is disabled when taskId is falsy', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getTasksNearby(9, 0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => challengeSingle.getTasksNearby(0, 3), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeSingle.useCloneChallenge', () => {
  it('clones a challenge and invalidates related caches', async () => {
    const cloned = { id: 21, name: 'Cloned' } as unknown as ChallengeGetResponse
    const fetchMock = stubFetch(new Response(JSON.stringify(cloned), { status: 200 }))
    const queryClient = createTestQueryClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => challengeSingle.useCloneChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ challengeId: 20, newName: 'Cloned Name/Weird' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(cloned)

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    expect(request.url).toContain(
      `api/v2/challenge/20/clone/${encodeURIComponent('Cloned Name/Weird')}`
    )
    expect(spy).toHaveBeenCalledWith({ queryKey: ['challenge'] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['challenge', 'managed'] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['project', 'challenges'] })
  })

  it('omits the projectId query param when no target project is given', async () => {
    const cloned = { id: 21, name: 'Cloned' } as unknown as ChallengeGetResponse
    const fetchMock = stubFetch(new Response(JSON.stringify(cloned), { status: 200 }))

    const { result } = renderHook(() => challengeSingle.useCloneChallenge(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ challengeId: 20, newName: 'Cloned' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).searchParams.has('projectId')).toBe(false)
  })

  it('sends the target projectId when cloning into a chosen project', async () => {
    const cloned = { id: 21, name: 'Cloned' } as unknown as ChallengeGetResponse
    const fetchMock = stubFetch(new Response(JSON.stringify(cloned), { status: 200 }))

    const { result } = renderHook(() => challengeSingle.useCloneChallenge(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ challengeId: 20, newName: 'Cloned', projectId: 7 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).searchParams.get('projectId')).toBe('7')
  })
})

type ChallengeDraft = Omit<Partial<Challenge>, 'dataOriginDate'> & {
  localGeoJSON?: string
  dataOriginDate?: string
}

describe('challengeSingle.useCreateChallenge', () => {
  it('applies defaults for omitted fields and omits extra keys when unset', async () => {
    const created = { id: 30, name: '' } as unknown as Challenge
    const fetchMock = stubFetch(new Response(JSON.stringify(created), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => challengeSingle.useCreateChallenge(), {
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

    const { result } = renderHook(() => challengeSingle.useCreateChallenge(), {
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
})

describe('challengeSingle.useUpdateChallenge', () => {
  it('updates a challenge and refreshes related caches', async () => {
    const updated = { id: 40, name: 'Updated' } as unknown as Challenge
    const fetchMock = stubFetch(new Response(JSON.stringify(updated), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => challengeSingle.useUpdateChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ challengeId: 40, updates: { name: 'Updated' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    const body = await request.clone().json()
    expect(body).toEqual({ id: 40, name: 'Updated' })

    expect(queryClient.getQueryData(['challenge', 40])).toEqual(updated)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['project', 'challenges'] })
    // The manage-challenges pages read from ['challenge', 'listing'], so it must be
    // invalidated or their cards keep rendering stale enabled/name values.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'listing'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'explore'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'exploreInfinite'] })
  })
})

describe('challengeSingle.useSaveOrUpdateChallenge', () => {
  it('saves or updates a challenge and refreshes related caches', async () => {
    const saved = { id: 50, name: 'Saved' } as unknown as Challenge
    const fetchMock = stubFetch(new Response(JSON.stringify(saved), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => challengeSingle.useSaveOrUpdateChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    const draft: Partial<Challenge> = { name: 'Saved' }
    result.current.mutate(draft)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('POST')
    const body = await request.clone().json()
    expect(body).toEqual(draft)

    expect(queryClient.getQueryData(['challenge', 50])).toEqual(saved)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['project', 'challenges'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'listing'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'explore'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'exploreInfinite'] })
  })
})

describe('challengeSingle.useUpdatePriorities', () => {
  it('updates priorities and refreshes task-dependent caches', async () => {
    const updated = { id: 60 } as unknown as Challenge
    const fetchMock = stubFetch(new Response(JSON.stringify(updated), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => challengeSingle.useUpdatePriorities(), {
      wrapper: queryClientWrapper(queryClient),
    })

    const priorities = makePriorities({ defaultPriority: 1 })
    result.current.mutate({ challengeId: 60, priorities })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    const body = await request.clone().json()
    expect(body).toEqual(priorities)

    expect(queryClient.getQueryData(['challenge', 60])).toEqual(updated)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'taskMarkers', 60] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task'] })
  })
})

describe('challengeSingle.usePreviewPriorities', () => {
  it('fetches a priority preview when enabled', async () => {
    const preview = { priorities: { '1': 0 }, counts: { high: 1, medium: 2, low: 3 } }
    stubFetch(new Response(JSON.stringify(preview), { status: 200 }))

    const draft = makePriorities({ defaultPriority: 2 })
    const { result } = renderHook(() => challengeSingle.usePreviewPriorities(7, draft), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(preview)
  })

  it('is disabled when draft is null', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => challengeSingle.usePreviewPriorities(7, null), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('is disabled when challengeId is not positive', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))
    const draft = makePriorities()

    const { result } = renderHook(() => challengeSingle.usePreviewPriorities(0, draft), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('is disabled when challengeId is not finite', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))
    const draft = makePriorities()

    const { result } = renderHook(() => challengeSingle.usePreviewPriorities(Number.NaN, draft), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to an empty body when manually refetched with a null draft', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ priorities: {}, counts: { high: 0, medium: 0, low: 0 } }), {
        status: 200,
      })
    )

    const { result } = renderHook(() => challengeSingle.usePreviewPriorities(7, null), {
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

describe('challengeSingle.useUploadGeoJSON', () => {
  it('uploads a GeoJSON file with default options', async () => {
    const fetchMock = stubFetch(new Response('null', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => challengeSingle.useUploadGeoJSON(), {
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

    const { result } = renderHook(() => challengeSingle.useUploadGeoJSON(), {
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

describe('challengeSingle.refreshChallenge', () => {
  it('invalidates all per-challenge aggregate caches', async () => {
    const queryClient = createTestQueryClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')

    await challengeSingle.refreshChallenge(80, queryClient)

    expect(spy).toHaveBeenCalledWith({ queryKey: ['challenge', 80] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['challenge', 'taskMarkers', 80] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['challenge', 'stats', 80] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['challenge', 'activity', 80] })
    expect(spy).toHaveBeenCalledTimes(4)
  })
})

describe('challengeSingle.useMoveChallenge', () => {
  it('moves a challenge to a new project and refreshes caches', async () => {
    const fetchMock = stubFetch(new Response('null', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => challengeSingle.useMoveChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ challengeId: 90, toProjectId: 5 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('POST')
    expect(request.url).toContain('api/v2/challenge/90/project/5')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 90] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['project', 'challenges'] })
  })
})

describe('challengeSingle.useDeleteChallenge', () => {
  it('deletes a challenge and clears related caches', async () => {
    const fetchMock = stubFetch(new Response('null', { status: 200 }))
    const queryClient = createTestQueryClient()
    const removeSpy = vi.spyOn(queryClient, 'removeQueries')
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => challengeSingle.useDeleteChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(95)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({ challengeId: 95 })
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(request.url).toContain('api/v2/challenge/95')
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 95] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['project', 'challenges'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'listing'] })
  })
})

describe('challengeSingle.useArchiveChallenge', () => {
  it('archives a challenge and refreshes related caches', async () => {
    const fetchMock = stubFetch(new Response('null', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => challengeSingle.useArchiveChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ challengeId: 100, isArchived: true })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('POST')
    expect(request.url).toContain('api/v2/challenge/100/archive')
    const body = await request.clone().json()
    expect(body).toEqual({ isArchived: true })

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 100] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['project', 'challenges'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'listing'] })
  })
})

describe('challengeSingle.useRebuildChallenge', () => {
  it('rebuilds a challenge without extra search params when none are provided', async () => {
    const fetchMock = stubFetch(new Response('null', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => challengeSingle.useRebuildChallenge(), {
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

    const { result } = renderHook(() => challengeSingle.useRebuildChallenge(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ challengeId: 111, removeUnmatched: true, skipSnapshot: false })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.searchParams.get('removeUnmatched')).toBe('true')
    expect(url.searchParams.get('skipSnapshot')).toBe('false')
  })
})
