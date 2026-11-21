// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { Comment } from '@/types/Comment'
import type { TaskGetResponse } from '@/types/Task'
import { useAddTaskBundleComment, useAddTaskComment } from './comments'

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

describe('useAddTaskComment', () => {
  it('appends the new comment when comments are not yet cached and skips the challenge activity invalidation when no task is cached', async () => {
    const newComment = fakeComment({ id: 10, taskId: 5, comment: 'first!' })
    stubFetch(new Response(JSON.stringify(newComment), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => useAddTaskComment(), {
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

    const { result } = renderHook(() => useAddTaskComment(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ taskId: 5, commentText: 'second!' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(queryClient.getQueryData(['task', 'comments', 5])).toEqual([existingComment, newComment])
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['challenge', 'activity', 42] })
  })
})

describe('useAddTaskComment actionId', () => {
  it('never sends an actionId, since the backend reads it as an action row id', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(fakeComment()), { status: 200 }))

    const { result } = renderHook(() => useAddTaskComment(), {
      wrapper: queryClientWrapper(),
    })
    result.current.mutate({ taskId: 5, commentText: 'done' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    expect(new URL((request as Request).url).searchParams.has('actionId')).toBe(false)
  })
})

describe('useAddTaskBundleComment', () => {
  it('posts the comment to every task in the bundle without an actionId', async () => {
    const fetchMock = stubFetch(new Response('', { status: 200 }))

    const { result } = renderHook(() => useAddTaskBundleComment(), {
      wrapper: queryClientWrapper(),
    })
    result.current.mutate({ bundleId: 8, primaryTaskId: 5, commentText: 'done' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const url = new URL((request as Request).url)
    expect((request as Request).method).toBe('POST')
    expect(url.pathname).toBe('/api/v2/taskBundle/8/comment')
    expect(url.searchParams.has('actionId')).toBe(false)
    expect(await (request as Request).clone().json()).toEqual({ comment: 'done' })
  })
})
