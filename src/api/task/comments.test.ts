// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { Comment } from '@/types/Comment'
import type { TaskGetResponse } from '@/types/Task'
import { taskComments } from './comments'

afterEach(() => {
  vi.unstubAllGlobals()
})

const fakeComment = (overrides: Partial<Comment> = {}): Comment => ({
  id: 1,
  osm_id: 100,
  osm_username: 'alice',
  avatarUrl: 'https://example.com/avatar.png',
  taskId: 1,
  challengeId: 1,
  projectId: 1,
  created: 1700000000,
  comment: 'hello',
  fullCount: 1,
  edited: false,
  ...overrides,
})

describe('taskComments.searchTaskComments', () => {
  it('searches with the default limit and is enabled by default', async () => {
    const comments = [fakeComment({ id: 1 })]
    const fetchMock = stubFetch(new Response(JSON.stringify(comments), { status: 200 }))

    const { result } = renderHook(() => taskComments.searchTaskComments({ q: 'road' }), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(comments)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect(url.pathname).toBe('/api/v2/comments/search')
    expect(url.searchParams.get('q')).toBe('road')
    expect(url.searchParams.get('limit')).toBe('10')
  })

  it('honors a custom limit', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => taskComments.searchTaskComments({ q: 'road', limit: 25 }), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(new URL((request as Request).url).searchParams.get('limit')).toBe('25')
  })

  it('does not fetch when enabled is false', () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(
      () => taskComments.searchTaskComments({ q: 'road', enabled: false }),
      { wrapper: queryClientWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskComments.getTaskComments', () => {
  it('fetches comments for a task id', async () => {
    const comments = [fakeComment({ id: 2 })]
    const fetchMock = stubFetch(new Response(JSON.stringify(comments), { status: 200 }))

    const { result } = renderHook(() => taskComments.getTaskComments(9), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(comments)
    expect(new URL((fetchMock.mock.calls[0][0] as Request).url).pathname).toBe(
      '/api/v2/task/9/comments'
    )
  })

  it('is disabled when taskId is 0', () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => taskComments.getTaskComments(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskComments.getTaskHistory', () => {
  it('fetches history actions for a task id', async () => {
    const history = [
      { taskId: 9, timestamp: 't', actionType: 1, user: { id: 1, username: 'alice' } },
    ]
    const fetchMock = stubFetch(new Response(JSON.stringify(history), { status: 200 }))

    const { result } = renderHook(() => taskComments.getTaskHistory(9), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(history)
    expect(new URL((fetchMock.mock.calls[0][0] as Request).url).pathname).toBe(
      '/api/v2/task/9/history'
    )
  })

  it('is disabled when taskId is 0', () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => taskComments.getTaskHistory(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskComments.getTaskSessionHistory', () => {
  it('fetches session history for a task id', async () => {
    const sessions = [
      {
        id: 1,
        created: '2026-09-01T12:00:00.000Z',
        user: { id: 1, username: 'alice' },
        taskId: 9,
        lockId: 4,
        event: 'lock',
        sessionType: 'Map',
        subType: null,
      },
    ]
    const fetchMock = stubFetch(new Response(JSON.stringify(sessions), { status: 200 }))

    const { result } = renderHook(() => taskComments.getTaskSessionHistory(9), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toEqual(sessions)
    expect(new URL((fetchMock.mock.calls[0][0] as Request).url).pathname).toBe(
      '/api/v2/task/9/sessionHistory'
    )
  })

  it('is disabled when taskId is 0', () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => taskComments.getTaskSessionHistory(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('taskComments.useAddTaskComment', () => {
  it('appends the new comment when comments are not yet cached and skips the challenge activity invalidation when no task is cached', async () => {
    const newComment = fakeComment({ id: 10, taskId: 5, comment: 'first!' })
    stubFetch(new Response(JSON.stringify(newComment), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskComments.useAddTaskComment(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 5, commentText: 'first!' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['task', 'comments', 5])).toEqual([newComment])
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['task', 'history', 5] })
    expect(invalidateSpy).not.toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: expect.arrayContaining(['challenge']) })
    )
  })

  it('appends to existing cached comments and invalidates the parent challenge activity feed', async () => {
    const existingComment = fakeComment({ id: 1, taskId: 5 })
    const newComment = fakeComment({ id: 11, taskId: 5, comment: 'second!' })
    stubFetch(new Response(JSON.stringify(newComment), { status: 200 }))
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['task', 'comments', 5], [existingComment])
    queryClient.setQueryData(['task', 5], { id: 5, parent: 42 } as unknown as TaskGetResponse)
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => taskComments.useAddTaskComment(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 5, commentText: 'second!' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['task', 'comments', 5])).toEqual([existingComment, newComment])
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'activity', 42] })
  })
})
