// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { TaskGetResponse, TasksBoundingBoxQuery } from '@/types/Task'
import { taskMultiple } from './multiple'

afterEach(() => {
  vi.unstubAllGlobals()
})

const fakeTask = (id: number, extra: Record<string, unknown> = {}) =>
  ({ id, name: `task-${id}`, ...extra }) as unknown as TaskGetResponse

describe('taskMultiple.getTasks', () => {
  it('returns all tasks from cache without fetching when every id is already cached', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['task', 1], fakeTask(1))
    queryClient.setQueryData(['task', 2], fakeTask(2))

    const { result } = renderHook(() => taskMultiple.getTasks([1, 2]), {
      wrapper: queryClientWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([fakeTask(1), fakeTask(2)])
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches only the missing ids and merges them with the cached tasks, caching the fetched ones', async () => {
    const fetchedTask = fakeTask(2)
    const fetchMock = stubFetch(new Response(JSON.stringify([fetchedTask]), { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['task', 1], fakeTask(1))

    const { result } = renderHook(() => taskMultiple.getTasks([1, 2]), {
      wrapper: queryClientWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual([fakeTask(1), fetchedTask])
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect(url.pathname).toBe('/api/v2/tasks')
    expect(url.searchParams.get('taskIds')).toBe('2')
    expect(url.searchParams.get('mapillary')).toBe('false')
    expect(queryClient.getQueryData(['task', 2])).toEqual(fetchedTask)
  })

  it('is disabled when given an empty array of task ids', () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => taskMultiple.getTasks([]), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskMultiple.getTaskMarkers', () => {
  it('fetches markers using the given search params', async () => {
    const response = { totalCount: 1, tasks: [] }
    const fetchMock = stubFetch(new Response(JSON.stringify(response), { status: 200 }))

    const { result } = renderHook(
      () => taskMultiple.getTaskMarkers({ statuses: '0,1', global: true }),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(response)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect(url.pathname).toBe('/api/v2/taskMarkers')
    expect(url.searchParams.get('statuses')).toBe('0,1')
    expect(url.searchParams.get('global')).toBe('true')
  })

  it('fetches markers with no search params when called without params', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ totalCount: 0 }), { status: 200 }))

    const { result } = renderHook(() => taskMultiple.getTaskMarkers(undefined), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(new URL((request as Request).url).search).toBe('')
  })
})

describe('taskMultiple.getTasksInBounds', () => {
  it('fetches tasks within bounds and is enabled by default', async () => {
    const response = { total: 1, tasks: [] }
    const fetchMock = stubFetch(new Response(JSON.stringify(response), { status: 200 }))

    const { result } = renderHook(
      () => taskMultiple.getTasksInBounds({ bounds: '1,2,3,4', limit: 5 }),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(response)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect(url.pathname).toBe('/api/v2/tasks/bounds')
    expect(url.searchParams.get('bounds')).toBe('1,2,3,4')
    expect(url.searchParams.get('limit')).toBe('5')
  })

  it('is disabled when options.enabled is false', () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))

    const { result } = renderHook(
      () => taskMultiple.getTasksInBounds({ bounds: '1,2,3,4' }, { enabled: false }),
      { wrapper: queryClientWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskMultiple.getTasksInBoundingBox', () => {
  const query: TasksBoundingBoxQuery = {
    left: -1,
    bottom: -1,
    right: 1,
    top: 1,
    challengeId: 7,
    limit: 25,
    page: 0,
    sort: 'id',
    order: 'ASC',
    taskStatuses: [0, 1],
    priorities: [0],
    reviewStatuses: [-1],
    metaReviewStatuses: [],
  }

  it('PUTs the bounding box query with the derived search params and is enabled by default', async () => {
    const response = { total: 2, tasks: [] }
    const fetchMock = stubFetch(new Response(JSON.stringify(response), { status: 200 }))

    const { result } = renderHook(() => taskMultiple.getTasksInBoundingBox(query), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(response)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect((request as Request).method).toBe('PUT')
    expect(url.pathname).toBe('/api/v2/tasks/box/-1/-1/1/1')
    expect(url.searchParams.get('cid')).toBe('7')
    expect(url.searchParams.get('tStatus')).toBe('0,1')
    expect(url.searchParams.get('priorities')).toBe('0')
    expect(url.searchParams.get('trStatus')).toBe('-1')
    expect(url.searchParams.get('mrStatus')).toBe('-1')
  })

  it('sends a property filter in the body, where a nested rule tree fits', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ total: 0, tasks: [] }), { status: 200 })
    )
    const taskPropertySearch = {
      key: 'surface',
      value: 'gravel',
      operator: 'equal',
    } as unknown as NonNullable<TasksBoundingBoxQuery['taskPropertySearch']>

    const { result } = renderHook(
      () => taskMultiple.getTasksInBoundingBox({ ...query, taskPropertySearch }),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(await (fetchMock.mock.calls[0][0] as Request).clone().json()).toEqual({
      taskPropertySearch,
    })
  })

  it('is disabled when options.enabled is false', () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))

    const { result } = renderHook(
      () => taskMultiple.getTasksInBoundingBox(query, { enabled: false }),
      { wrapper: queryClientWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskMultiple.getTaskIdsMatchingProperties', () => {
  const propertySearch = {
    key: 'surface',
    value: 'gravel',
    operator: 'equal',
  } as unknown as NonNullable<Parameters<typeof taskMultiple.getTaskIdsMatchingProperties>[1]>

  it('resolves the property filter across the whole challenge, not the current view', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ total: 2, tasks: [{ id: 1 }, { id: 2 }] }), { status: 200 })
    )

    const { result } = renderHook(
      () => taskMultiple.getTaskIdsMatchingProperties(7, propertySearch),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(new Set([1, 2]))

    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect((request as Request).method).toBe('PUT')
    expect(url.pathname).toBe('/api/v2/tasks/box/-180/-85/180/85')
    expect(url.searchParams.get('cid')).toBe('7')
    expect(url.searchParams.get('includeGeometries')).toBe('false')
    expect(await (request as Request).clone().json()).toEqual({
      taskPropertySearch: propertySearch,
    })
  })

  it('does not query without a filter, or while switched off', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result: noFilter } = renderHook(
      () => taskMultiple.getTaskIdsMatchingProperties(7, null),
      { wrapper: queryClientWrapper() }
    )
    const { result: switchedOff } = renderHook(
      () => taskMultiple.getTaskIdsMatchingProperties(7, propertySearch, { enabled: false }),
      { wrapper: queryClientWrapper() }
    )

    expect(noFilter.current.fetchStatus).toBe('idle')
    expect(switchedOff.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskMultiple.getChallengePropertyKeys', () => {
  it('collects the distinct property names across a sample of the challenge’s tasks', async () => {
    const fetchMock = stubFetch(
      new Response(
        JSON.stringify({
          total: 2,
          tasks: [
            {
              id: 1,
              geometries: {
                features: [
                  { properties: { surface: 'gravel', highway: 'track' } },
                  { properties: null },
                ],
              },
            },
            { id: 2, geometries: { features: [{ properties: { access: 'yes' } }] } },
            { id: 3 },
          ],
        }),
        { status: 200 }
      )
    )

    const { result } = renderHook(() => taskMultiple.getChallengePropertyKeys(7), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(['access', 'highway', 'surface'])

    const url = new URL((fetchMock.mock.calls[0][0] as Request).url)
    expect(url.pathname).toBe('/api/v2/tasks/box/-180/-85/180/85')
    expect(url.searchParams.get('includeGeometries')).toBe('true')
  })

  it('has no names to offer when the sample comes back empty', async () => {
    stubFetch(new Response(JSON.stringify({ total: 0 }), { status: 200 }))

    const { result } = renderHook(() => taskMultiple.getChallengePropertyKeys(7), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('does not query without a challenge, or while switched off', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result: noChallenge } = renderHook(() => taskMultiple.getChallengePropertyKeys(0), {
      wrapper: queryClientWrapper(),
    })
    const { result: switchedOff } = renderHook(
      () => taskMultiple.getChallengePropertyKeys(7, { enabled: false }),
      { wrapper: queryClientWrapper() }
    )

    expect(noChallenge.current.fetchStatus).toBe('idle')
    expect(switchedOff.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
