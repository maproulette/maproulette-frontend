// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { Task } from '@/types/Task'
import {
  type TaskBundleResponse,
  useCreateTaskBundle,
  useUpdateTaskBundle,
  useUpdateTaskBundleStatus,
} from './queries'

afterEach(() => {
  vi.unstubAllGlobals()
})

const fakeTask = (id: number) => ({ id, name: `task-${id}` }) as unknown as Task

describe('useCreateTaskBundle', () => {
  it('creates a bundle, caches it, and invalidates in-bounds task queries', async () => {
    const bundle: TaskBundleResponse = {
      bundleId: 3,
      ownerId: 5,
      taskIds: [1],
      tasks: [fakeTask(1)],
    }
    const fetchMock = stubFetch(new Response(JSON.stringify(bundle), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCreateTaskBundle(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ name: 'my bundle', taskIds: [1] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(bundle)
    const [request] = fetchMock.mock.calls[0]
    expect((request as Request).method).toBe('POST')
    expect(new URL((request as Request).url).pathname).toBe('/api/v2/taskBundle')
    expect(await (request as Request).clone().json()).toEqual({ name: 'my bundle', taskIds: [1] })
    expect(queryClient.getQueryData(['taskBundle', 3])).toEqual(bundle)
  })

  it('skips task caching when the created bundle has no tasks', async () => {
    const bundle: TaskBundleResponse = { bundleId: 4, ownerId: 5, taskIds: [] }
    stubFetch(new Response(JSON.stringify(bundle), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useCreateTaskBundle(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ name: 'empty bundle', taskIds: [] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['taskBundle', 4])).toEqual(bundle)
  })
})

describe('useUpdateTaskBundle', () => {
  it('updates a bundle with comma-joined task ids and invalidates in-bounds task queries', async () => {
    const updatedBundle: TaskBundleResponse = {
      bundleId: 5,
      ownerId: 5,
      taskIds: [1, 2],
      tasks: [fakeTask(1), fakeTask(2)],
    }
    const fetchMock = stubFetch(new Response(JSON.stringify(updatedBundle), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useUpdateTaskBundle(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ bundleId: 5, taskIds: [1, 2] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect(url.pathname).toBe('/api/v2/taskBundle/5/update')
    expect(url.searchParams.get('taskIds')).toBe('1,2')
    expect(queryClient.getQueryData(['taskBundle', 5])).toEqual(updatedBundle)
  })

  it('skips task caching when the updated bundle has no tasks', async () => {
    const updatedBundle: TaskBundleResponse = { bundleId: 6, ownerId: 5, taskIds: [] }
    stubFetch(new Response(JSON.stringify(updatedBundle), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useUpdateTaskBundle(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ bundleId: 6, taskIds: [] })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['taskBundle', 6])).toEqual(updatedBundle)
  })
})

describe('useUpdateTaskBundleStatus', () => {
  it('PUTs the new status with the primary id, then invalidates bundle/task/challenge queries', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useUpdateTaskBundleStatus(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ bundleId: 8, primaryId: 1, status: 2 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect((request as Request).method).toBe('PUT')
    expect(url.pathname).toBe('/api/v2/taskBundle/8/2')
    expect(url.searchParams.get('primaryId')).toBe('1')
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['taskBundle', 8] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge'] })
  })

  it('sends completion responses as the request body', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))

    const { result } = renderHook(() => useUpdateTaskBundleStatus(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({
      bundleId: 8,
      primaryId: 1,
      status: 1,
      completionResponses: { surface: 'paved' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(await (request as Request).clone().json()).toEqual({ surface: 'paved' })
  })

  it('forwards opaque plugin query params, dropping the ones with no value', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))

    const { result } = renderHook(() => useUpdateTaskBundleStatus(), {
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
