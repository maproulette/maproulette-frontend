// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { TaskGetResponse } from '@/types/Task'
import { taskMultiple } from './multiple'

afterEach(() => {
  vi.unstubAllGlobals()
})

const fakeTask = (id: number, extra: Record<string, unknown> = {}) =>
  ({ id, name: `task-${id}`, ...extra }) as unknown as TaskGetResponse

describe('taskMultiple.getTasks', () => {
  it('fetches the requested ids from the batch endpoint', async () => {
    const fetchedTasks = [fakeTask(1), fakeTask(2)]
    const fetchMock = stubFetch(new Response(JSON.stringify(fetchedTasks), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => taskMultiple.getTasks([1, 2]), {
      wrapper: queryClientWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(fetchedTasks)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect(url.pathname).toBe('/api/v2/tasks')
    expect(url.searchParams.get('taskIds')).toBe('1,2')
    expect(url.searchParams.get('mapillary')).toBe('false')
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
