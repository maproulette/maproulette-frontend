// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { waitFor } from '@/test/waitFor'
import { taskBulk } from './bulk'

// `.clone()` gives each concurrent fetch its own readable body stream — several
// of these mutations fire multiple requests in parallel against the same
// stubbed response, and a shared Response's body can only be consumed once.
function stubFetch(response: Response) {
  const fetchMock = vi.fn(async (_request: Request) => response.clone())
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('taskBulk.useBulkUpdateStatus', () => {
  it('PUTs a status update for every task id and invalidates task/challenge queries', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskBulk.useBulkUpdateStatus(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskIds: [1, 2], status: 3 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({ taskIds: [1, 2] })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    const urls = fetchMock.mock.calls
      .map(([request]) => new URL((request as Request).url).pathname)
      .sort()
    expect(urls).toEqual(['/api/v2/task/1/3', '/api/v2/task/2/3'])
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge'] })
  })

  it('surfaces a rejection when a status update request fails', async () => {
    stubFetch(new Response('', { status: 500 }))
    const { result } = renderHook(() => taskBulk.useBulkUpdateStatus(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ taskIds: [1], status: 3 })

    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('taskBulk.useBulkDelete', () => {
  it('DELETEs the given task ids and returns the bulk delete result', async () => {
    const deleteResult = { requested: 2, deleted: 1, denied: [2] }
    const fetchMock = stubFetch(new Response(JSON.stringify(deleteResult), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskBulk.useBulkDelete(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate([1, 2])

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(deleteResult)
    const [request] = fetchMock.mock.calls[0]
    expect((request as Request).method).toBe('DELETE')
    expect(new URL((request as Request).url).pathname).toBe('/api/v2/tasks')
    expect(await (request as Request).clone().json()).toEqual({ taskIds: [1, 2] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge'] })
  })
})

describe('taskBulk.useBulkArchive', () => {
  it('PUTs the archived flag for the given task ids and invalidates task/challenge queries', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskBulk.useBulkArchive(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskIds: [7], archived: true })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect((request as Request).method).toBe('PUT')
    expect(new URL((request as Request).url).pathname).toBe('/api/v2/tasks/archive')
    expect(await (request as Request).clone().json()).toEqual({ taskIds: [7], archived: true })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge'] })
  })
})

describe('taskBulk.useBulkReassign', () => {
  it('PUTs the new owner for the given task ids and returns the reassign result', async () => {
    const reassignResult = { requested: 2, updated: 2 }
    const fetchMock = stubFetch(new Response(JSON.stringify(reassignResult), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskBulk.useBulkReassign(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskIds: [1, 2], userId: 99 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(reassignResult)
    const [request] = fetchMock.mock.calls[0]
    expect(new URL((request as Request).url).pathname).toBe('/api/v2/tasks/reassign')
    expect(await (request as Request).clone().json()).toEqual({ taskIds: [1, 2], userId: 99 })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task'] })
  })
})

describe('taskBulk.useBulkClearLock', () => {
  it('POSTs the given task ids to unlock them and invalidates task/challenge queries', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskBulk.useBulkClearLock(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate([3, 4])

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect((request as Request).method).toBe('POST')
    expect(new URL((request as Request).url).pathname).toBe('/api/v2/task/bundle/unlock')
    expect(await (request as Request).clone().json()).toEqual([3, 4])
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge'] })
  })
})
