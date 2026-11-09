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
  it('PUTs the full tasks with the new status and cleared review fields in one batch update', async () => {
    const fetchMock = vi.fn(async (request: Request) => {
      const path = new URL(request.url).pathname
      const match = path.match(/^\/api\/v2\/task\/(\d+)$/)
      if (match) {
        const id = Number(match[1])
        return new Response(
          JSON.stringify({
            id,
            name: `task ${id}`,
            parent: 9,
            status: 1,
            cooperativeWork: { a: id },
          }),
          { status: 200 }
        )
      }
      return new Response('', { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskBulk.useBulkUpdateStatus(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskIds: [1, 2], status: 0 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({ taskIds: [1, 2] })
    const put = fetchMock.mock.calls
      .map(([request]) => request)
      .find((request) => request.method === 'PUT')
    expect(put).toBeDefined()
    expect(new URL((put as Request).url).pathname).toBe('/api/v2/tasks')
    const reset = {
      status: 0,
      mappedOn: null,
      reviewStatus: null,
      reviewRequestedBy: null,
      reviewedBy: null,
      reviewedAt: null,
    }
    expect(await (put as Request).clone().json()).toEqual([
      { id: '1', name: 'task 1', parent: 9, cooperativeWork: { a: 1 }, ...reset },
      { id: '2', name: 'task 2', parent: 9, cooperativeWork: { a: 2 }, ...reset },
    ])
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
    const deleteResult = { requested: 2, deleted: 1 }
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
