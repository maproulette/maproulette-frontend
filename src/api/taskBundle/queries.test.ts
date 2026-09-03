// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { Task } from '@/types/Task'
import { type TaskBundleResponse, taskBundleQueries } from './queries'

afterEach(() => {
  vi.unstubAllGlobals()
})

const fakeTask = (id: number) => ({ id, name: `task-${id}` }) as unknown as Task

describe('taskBundleQueries.getTaskBundle', () => {
  it('fetches the bundle without locking tasks by default and caches its tasks', async () => {
    const bundle: TaskBundleResponse = {
      bundleId: 1,
      ownerId: 5,
      taskIds: [1, 2],
      tasks: [fakeTask(1), fakeTask(2)],
    }
    const fetchMock = stubFetch(new Response(JSON.stringify(bundle), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => taskBundleQueries.getTaskBundle(1), {
      wrapper: queryClientWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(bundle)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect((request as Request).method).toBe('POST')
    expect(url.pathname).toBe('/api/v2/taskBundle/1')
    expect(url.searchParams.get('lockTasks')).toBe('false')
    expect(queryClient.getQueryData(['task', 1])).toEqual(fakeTask(1))
    expect(queryClient.getQueryData(['task', 2])).toEqual(fakeTask(2))
  })

  it('requests locking when lockTasks is true and skips task caching when the bundle has no tasks', async () => {
    const bundle: TaskBundleResponse = { bundleId: 2, ownerId: 5, taskIds: [] }
    const fetchMock = stubFetch(new Response(JSON.stringify(bundle), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => taskBundleQueries.getTaskBundle(2, true), {
      wrapper: queryClientWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(new URL((request as Request).url).searchParams.get('lockTasks')).toBe('true')
    expect(queryClient.getQueryData(['task', 1])).toBeUndefined()
  })

  it('is disabled when bundleId is 0', () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))

    const { result } = renderHook(() => taskBundleQueries.getTaskBundle(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskBundleQueries.useCreateTaskBundle', () => {
  it('creates a bundle, caches it and its tasks, and invalidates in-bounds task queries', async () => {
    const bundle: TaskBundleResponse = {
      bundleId: 3,
      ownerId: 5,
      taskIds: [1],
      tasks: [fakeTask(1)],
    }
    const fetchMock = stubFetch(new Response(JSON.stringify(bundle), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskBundleQueries.useCreateTaskBundle(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ name: 'my bundle', taskIds: [1] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(bundle)
    const [request] = fetchMock.mock.calls[0]
    expect((request as Request).method).toBe('POST')
    expect(new URL((request as Request).url).pathname).toBe('/api/v2/taskBundle')
    expect(await (request as Request).clone().json()).toEqual({ name: 'my bundle', taskIds: [1] })
    expect(queryClient.getQueryData(['taskBundle', 3, { lockTasks: false }])).toEqual(bundle)
    expect(queryClient.getQueryData(['task', 1])).toEqual(fakeTask(1))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'inBounds'] })
  })

  it('skips task caching when the created bundle has no tasks', async () => {
    const bundle: TaskBundleResponse = { bundleId: 4, ownerId: 5, taskIds: [] }
    stubFetch(new Response(JSON.stringify(bundle), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => taskBundleQueries.useCreateTaskBundle(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ name: 'empty bundle', taskIds: [] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['taskBundle', 4, { lockTasks: false }])).toEqual(bundle)
  })
})

describe('taskBundleQueries.useUpdateTaskBundle', () => {
  it('updates a bundle with comma-joined task ids, caches its tasks, and invalidates in-bounds task queries', async () => {
    const updatedBundle: TaskBundleResponse = {
      bundleId: 5,
      ownerId: 5,
      taskIds: [1, 2],
      tasks: [fakeTask(1), fakeTask(2)],
    }
    const fetchMock = stubFetch(new Response(JSON.stringify(updatedBundle), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskBundleQueries.useUpdateTaskBundle(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ bundleId: 5, taskIds: [1, 2] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect(url.pathname).toBe('/api/v2/taskBundle/5/update')
    expect(url.searchParams.get('taskIds')).toBe('1,2')
    expect(queryClient.getQueryData(['taskBundle', 5, { lockTasks: false }])).toEqual(updatedBundle)
    expect(queryClient.getQueryData(['task', 2])).toEqual(fakeTask(2))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'inBounds'] })
  })

  it('skips task caching when the updated bundle has no tasks', async () => {
    const updatedBundle: TaskBundleResponse = { bundleId: 6, ownerId: 5, taskIds: [] }
    stubFetch(new Response(JSON.stringify(updatedBundle), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => taskBundleQueries.useUpdateTaskBundle(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ bundleId: 6, taskIds: [] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['taskBundle', 6, { lockTasks: false }])).toEqual(updatedBundle)
  })
})

describe('taskBundleQueries.useDeleteTaskBundle', () => {
  it('deletes a bundle, removes its cache entries, and invalidates in-bounds task queries', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['taskBundle', 7, { lockTasks: false }], { bundleId: 7 })
    const removeSpy = vi.spyOn(queryClient, 'removeQueries')
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskBundleQueries.useDeleteTaskBundle(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(7)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect((request as Request).method).toBe('DELETE')
    expect(new URL((request as Request).url).pathname).toBe('/api/v2/taskBundle/7')
    expect(removeSpy).toHaveBeenCalledWith({ queryKey: ['taskBundle', 7] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'inBounds'] })
  })
})

describe('taskBundleQueries.useUpdateTaskBundleStatus', () => {
  it('PUTs the new status with the primary id and joined tags, then invalidates bundle/task/challenge queries', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskBundleQueries.useUpdateTaskBundleStatus(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ bundleId: 8, primaryId: 1, status: 2, tags: ['a', 'b'] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect((request as Request).method).toBe('PUT')
    expect(url.pathname).toBe('/api/v2/taskBundle/8/2')
    expect(url.searchParams.get('primaryId')).toBe('1')
    expect(url.searchParams.get('tags')).toBe('a,b')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['taskBundle', 8] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge'] })
  })

  it('omits the tags search param when tags is undefined', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))

    const { result } = renderHook(() => taskBundleQueries.useUpdateTaskBundleStatus(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ bundleId: 9, primaryId: 1, status: 3 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(new URL((request as Request).url).searchParams.has('tags')).toBe(false)
  })

  it('omits the tags search param when tags is an empty array', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))

    const { result } = renderHook(() => taskBundleQueries.useUpdateTaskBundleStatus(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({ bundleId: 10, primaryId: 1, status: 3, tags: [] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(new URL((request as Request).url).searchParams.has('tags')).toBe(false)
  })

  it('forwards opaque plugin query params, dropping the ones with no value', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))

    const { result } = renderHook(() => taskBundleQueries.useUpdateTaskBundleStatus(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({
      bundleId: 11,
      primaryId: 1,
      status: 3,
      queryParams: { pluginFlag: true, attempt: 2, omitted: null, alsoOmitted: undefined },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const url = new URL((fetchMock.mock.calls[0][0] as Request).url)
    expect(url.searchParams.get('pluginFlag')).toBe('true')
    expect(url.searchParams.get('attempt')).toBe('2')
    expect(url.searchParams.has('omitted')).toBe(false)
    expect(url.searchParams.has('alsoOmitted')).toBe(false)
  })
})
