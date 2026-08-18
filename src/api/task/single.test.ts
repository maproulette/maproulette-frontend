// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { TaskGetResponse } from '@/types/Task'
import { taskSingle } from './single'

function makeTask(overrides: Partial<TaskGetResponse> = {}): TaskGetResponse {
  return {
    id: 1,
    name: 'Task 1',
    created: 0,
    modified: 0,
    parent: 10,
    geometries: {},
    review: {},
    priority: 0,
    errorTags: '',
    skipCount: 0,
    archived: false,
    status: 0,
    ...overrides,
  } as unknown as TaskGetResponse
}

function stubRoutedFetch(handler: (request: Request) => Response | Promise<Response>) {
  const fetchMock = vi.fn(async (request: Request) => handler(request))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('taskSingle.searchTasks', () => {
  it('searches with the default limit', async () => {
    const results = [{ id: 1, name: 'Task 1', status: 0, parent: 10, challengeName: 'Challenge' }]
    const fetchMock = stubFetch(new Response(JSON.stringify(results), { status: 200 }))

    const { result } = renderHook(() => taskSingle.searchTasks({ q: 'road' }), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(results)
    const [request] = fetchMock.mock.calls[0] as [Request]
    const url = new URL(request.url)
    expect(url.pathname).toBe('/api/v2/tasks/search')
    expect(url.searchParams.get('q')).toBe('road')
    expect(url.searchParams.get('limit')).toBe('25')
  })

  it('searches with a custom limit', async () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => taskSingle.searchTasks({ q: 'road', limit: 5 }), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0] as [Request]
    const url = new URL(request.url)
    expect(url.searchParams.get('limit')).toBe('5')
  })

  it('is disabled when q is empty', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => taskSingle.searchTasks({ q: '' }), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskSingle.startTask', () => {
  it('starts a task', async () => {
    const task = makeTask({ id: 7 })
    const fetchMock = stubFetch(new Response(JSON.stringify(task), { status: 200 }))

    const { result } = renderHook(() => taskSingle.startTask(7), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(task)
    const [request] = fetchMock.mock.calls[0] as [Request]
    expect(new URL(request.url).pathname).toBe('/api/v2/task/7/start')
  })

  it('is disabled when taskId is falsy', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => taskSingle.startTask(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskSingle.getTaskOptions', () => {
  it('builds enabled query options for a truthy taskId', () => {
    const options = taskSingle.getTaskOptions(9)
    expect(options.queryKey).toEqual(['task', 9])
    expect(options.enabled).toBe(true)
  })

  it('builds disabled query options for a falsy taskId', () => {
    const options = taskSingle.getTaskOptions(0)
    expect(options.enabled).toBe(false)
  })
})

describe('taskSingle.getTask', () => {
  it('fetches a task by id, exercising the shared getTaskOptions queryFn', async () => {
    const task = makeTask({ id: 9 })
    const fetchMock = stubFetch(new Response(JSON.stringify(task), { status: 200 }))

    const { result } = renderHook(() => taskSingle.getTask(9), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(task)
    const [request] = fetchMock.mock.calls[0] as [Request]
    expect(new URL(request.url).pathname).toBe('/api/v2/task/9')
  })

  it('is disabled when taskId is falsy', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => taskSingle.getTask(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskSingle.useLockTask', () => {
  it('locks a task, caches it, and patches the challenge marker with the current user id', async () => {
    const lockedTask = makeTask({ id: 1, parent: 10 })
    stubFetch(new Response(JSON.stringify(lockedTask), { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['user', 'whoami'], { id: 42 })
    queryClient.setQueryData(['challenge', 'taskMarkers', 10], {
      markers: [{ id: 1, status: 0 }],
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useLockTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['task', 1])).toEqual(lockedTask)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'history', 1] })
    const markers = queryClient.getQueryData<{ markers: Array<{ id: number; lockedBy: number }> }>([
      'challenge',
      'taskMarkers',
      10,
    ])
    expect(markers?.markers[0].lockedBy).toBe(42)
  })

  it('falls back to a null locked-by id when no user is cached', async () => {
    const lockedTask = makeTask({ id: 2, parent: 10 })
    stubFetch(new Response(JSON.stringify(lockedTask), { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 'taskMarkers', 10], {
      markers: [{ id: 2, status: 0 }],
    })

    const { result } = renderHook(() => taskSingle.useLockTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(2)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const markers = queryClient.getQueryData<{
      markers: Array<{ id: number; lockedBy: number | null }>
    }>(['challenge', 'taskMarkers', 10])
    expect(markers?.markers[0].lockedBy).toBeNull()
  })

  it('skips the marker patch entirely when the locked task has no parent', async () => {
    const lockedTask = makeTask({ id: 3, parent: 0 })
    stubFetch(new Response(JSON.stringify(lockedTask), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => taskSingle.useLockTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['task', 3])).toEqual(lockedTask)
    expect(queryClient.getQueryData(['challenge', 'taskMarkers', 0])).toBeUndefined()
  })
})

describe('taskSingle.useUnlockTask', () => {
  it('unlocks a task, caches it, and clears the lock on the challenge marker', async () => {
    const unlockedTask = makeTask({ id: 3, parent: 11 })
    stubFetch(new Response(JSON.stringify(unlockedTask), { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['challenge', 'taskMarkers', 11], {
      markers: [{ id: 3, lockedBy: 42 }],
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useUnlockTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['task', 3])).toEqual(unlockedTask)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'history', 3] })
    const markers = queryClient.getQueryData<{
      markers: Array<{ id: number; lockedBy: number | null }>
    }>(['challenge', 'taskMarkers', 11])
    expect(markers?.markers[0].lockedBy).toBeNull()
  })

  it('skips the marker patch when the unlocked task has no parent', async () => {
    const unlockedTask = makeTask({ id: 4, parent: 0 })
    stubFetch(new Response(JSON.stringify(unlockedTask), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => taskSingle.useUnlockTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(4)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData(['challenge', 'taskMarkers', 0])).toBeUndefined()
  })
})

describe('taskSingle.useLockTaskBundle', () => {
  it('PUTs the bundled task ids as repeated taskIds params and invalidates inBounds tasks', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ lockPrimaryTaskId: 1, lockBundledTasks: [2, 3] }), {
        status: 200,
      })
    )
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useLockTaskBundle(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 1, taskIds: [2, 3] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual({ lockPrimaryTaskId: 1, lockBundledTasks: [2, 3] })
    const [request] = fetchMock.mock.calls[0] as [Request]
    expect(request.method).toBe('PUT')
    const url = new URL(request.url)
    expect(url.pathname).toBe('/api/v2/task/1/lockBundle')
    expect(url.searchParams.getAll('taskIds')).toEqual(['2', '3'])
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'inBounds'] })
  })

  it('logs and swallows a failed bundle lock update', async () => {
    const { logger } = await import('@/lib/logger')
    const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    stubFetch(new Response('conflict', { status: 409 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => taskSingle.useLockTaskBundle(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 1, taskIds: [2] })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Failed to update bundle lock',
      expect.objectContaining({ variables: { taskId: 1, taskIds: [2] } })
    )

    loggerErrorSpy.mockRestore()
  })
})

describe('taskSingle.useSkipTask', () => {
  it('marks a cached task skipped, invalidates aggregates when the status actually changed, and patches the marker', async () => {
    stubFetch(new Response('', { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['task', 1], makeTask({ id: 1, parent: 10, status: 1 }))
    queryClient.setQueryData(['challenge', 'taskMarkers', 10], {
      markers: [{ id: 1, status: 1 }],
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useSkipTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(1)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData<TaskGetResponse>(['task', 1])?.status).toBe(3)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'history', 1] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 10] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'stats', 10] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'activity', 10] })
    const markers = queryClient.getQueryData<{ markers: Array<{ id: number; status: number }> }>([
      'challenge',
      'taskMarkers',
      10,
    ])
    expect(markers?.markers[0].status).toBe(3)
  })

  it('does not invalidate aggregates when the cached task was already skipped', async () => {
    stubFetch(new Response('', { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['task', 2], makeTask({ id: 2, parent: 12, status: 3 }))
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useSkipTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(2)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['challenge', 12] })
  })

  it('handles a task with no cache entry, skipping the cache update and marker patch entirely', async () => {
    stubFetch(new Response('', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useSkipTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(99)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['task', 99])).toBeUndefined()
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'history', 99] })
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['challenge']) })
    )
  })
})

describe('taskSingle.updateTask', () => {
  it('PUTs the task body and returns the updated task', async () => {
    const updated = makeTask({ id: 1, name: 'Updated' })
    const fetchMock = stubFetch(new Response(JSON.stringify(updated), { status: 200 }))

    const result = await taskSingle.updateTask(1, makeTask({ id: 1, name: 'Updated' }))

    expect(result).toEqual(updated)
    const [request] = fetchMock.mock.calls[0] as [Request]
    expect(request.method).toBe('PUT')
    expect(new URL(request.url).pathname).toBe('/api/v2/task/1')
  })
})

describe('taskSingle.useUpdateTask', () => {
  it('updates the task, invalidates aggregates on status change, and patches the marker', async () => {
    const updated = makeTask({ id: 1, parent: 10, status: 2, priority: 1 })
    stubFetch(new Response(JSON.stringify(updated), { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['task', 1], makeTask({ id: 1, status: 1 }))
    queryClient.setQueryData(['challenge', 'taskMarkers', 10], {
      markers: [{ id: 1, status: 1, priority: 0 }],
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useUpdateTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 1, body: makeTask({ id: 1, status: 2, priority: 1 }) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['task', 1])).toEqual(updated)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'history', 1] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 10] })
    const markers = queryClient.getQueryData<{
      markers: Array<{ id: number; status: number; priority: number }>
    }>(['challenge', 'taskMarkers', 10])
    expect(markers?.markers[0]).toEqual({ id: 1, status: 2, priority: 1 })
  })

  it('does not invalidate aggregates when the status is unchanged, and defaults a null status to undefined on the marker patch', async () => {
    const updated = makeTask({ id: 1, parent: 10, status: null, priority: 1 })
    stubFetch(new Response(JSON.stringify(updated), { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['task', 1], makeTask({ id: 1, status: null }))
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useUpdateTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 1, body: makeTask({ id: 1, status: null }) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['challenge', 10] })
  })

  it('skips the marker patch entirely when the updated task has no parent', async () => {
    const updated = makeTask({ id: 1, parent: 0, status: 2 })
    stubFetch(new Response(JSON.stringify(updated), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => taskSingle.useUpdateTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 1, body: makeTask({ id: 1, status: 2 }) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(queryClient.getQueryData(['task', 1])).toEqual(updated)
  })

  it('treats a missing cache entry as a null previous status', async () => {
    const updated = makeTask({ id: 5, parent: 20, status: 2 })
    stubFetch(new Response(JSON.stringify(updated), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useUpdateTask(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 5, body: makeTask({ id: 5, status: 2 }) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 20] })
  })
})

describe('taskSingle.useUpdateTaskStatus', () => {
  it('builds a query string with tags and requestReview, posts a comment, and falls back to a GET when the PUT has no JSON body', async () => {
    const finalTask = makeTask({ id: 1, parent: 10, status: 2 })
    const fetchMock = stubRoutedFetch((request) => {
      const url = new URL(request.url)
      if (request.method === 'PUT' && url.pathname === '/api/v2/task/1/2') {
        expect(url.searchParams.get('tags')).toBe('a,b')
        expect(url.searchParams.get('requestReview')).toBe('true')
        return new Response(null, { status: 204 })
      }
      if (request.method === 'POST' && url.pathname === '/api/v2/task/1/comment') {
        return new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      if (request.method === 'GET' && url.pathname === '/api/v2/task/1') {
        return new Response(JSON.stringify(finalTask), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      throw new Error(`Unexpected request: ${request.method} ${url.pathname}`)
    })
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['task', 1], makeTask({ id: 1, status: 1 }))
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useUpdateTaskStatus(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({
      taskId: 1,
      status: 2,
      options: { tags: ['a', 'b'], requestReview: true, comment: 'looks good' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(finalTask)
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(queryClient.getQueryData(['task', 1])).toEqual(finalTask)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'history', 1] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'comments', 1] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 10] })
  })

  it('logs and swallows a comment POST failure so the status update still succeeds and updates caches', async () => {
    const { logger } = await import('@/lib/logger')
    const loggerErrorSpy = vi.spyOn(logger, 'error').mockImplementation(() => {})
    const finalTask = makeTask({ id: 4, parent: 20, status: 2 })
    const fetchMock = stubRoutedFetch((request) => {
      const url = new URL(request.url)
      if (request.method === 'PUT' && url.pathname === '/api/v2/task/4/2') {
        return new Response(JSON.stringify(finalTask), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
      if (request.method === 'POST' && url.pathname === '/api/v2/task/4/comment') {
        return new Response('server error', { status: 500 })
      }
      throw new Error(`Unexpected request: ${request.method} ${url.pathname}`)
    })
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useUpdateTaskStatus(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 4, status: 2, options: { comment: 'looks good' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(finalTask)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Failed to add comment after task status update',
      expect.objectContaining({ taskId: 4, status: 2 })
    )
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 20] })

    loggerErrorSpy.mockRestore()
  })

  it('omits the query string and returns the PUT response JSON directly when no options are given', async () => {
    const finalTask = makeTask({ id: 2, parent: 5, status: 1 })
    const fetchMock = stubRoutedFetch((request) => {
      const url = new URL(request.url)
      expect(request.method).toBe('PUT')
      expect(url.pathname).toBe('/api/v2/task/2/1')
      expect(url.search).toBe('')
      return new Response(JSON.stringify(finalTask), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useUpdateTaskStatus(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 2, status: 1 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(finalTask)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['task', 'comments', 2] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 5] })
  })

  it('sets requestReview=false explicitly, and skips the marker/aggregate patch when the updated task has no parent', async () => {
    const finalTask = makeTask({ id: 3, parent: 0, status: 3 })
    const fetchMock = stubRoutedFetch((request) => {
      const url = new URL(request.url)
      expect(url.searchParams.get('requestReview')).toBe('false')
      expect(url.searchParams.has('tags')).toBe(false)
      return new Response(JSON.stringify(finalTask), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['task', 3], makeTask({ id: 3, status: 3 }))
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useUpdateTaskStatus(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 3, status: 3, options: { requestReview: false } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['challenge']) })
    )
  })

  it('treats an empty tags array as absent, and skips aggregate invalidation when the status is unchanged', async () => {
    const finalTask = makeTask({ id: 4, parent: 7, status: 2 })
    const fetchMock = stubRoutedFetch((request) => {
      const url = new URL(request.url)
      expect(url.searchParams.has('tags')).toBe(false)
      return new Response(JSON.stringify(finalTask), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    })
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['task', 4], makeTask({ id: 4, status: 2 }))
    queryClient.setQueryData(['challenge', 'taskMarkers', 7], {
      markers: [{ id: 4, status: 1 }],
    })
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskSingle.useUpdateTaskStatus(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 4, status: 2, options: { tags: [] } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: ['challenge', 7] })
    const markers = queryClient.getQueryData<{ markers: Array<{ id: number; status: number }> }>([
      'challenge',
      'taskMarkers',
      7,
    ])
    expect(markers?.markers[0].status).toBe(2)
  })
})
