// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { challengeLikes } from './likes'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('challengeLikes.isChallengeLiked', () => {
  it('fetches the liked status for a challenge', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ isLiked: true }), { status: 200 }))

    const { result } = renderHook(() => challengeLikes.isChallengeLiked(3), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ isLiked: true })
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/challenge/3/like')
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ isLiked: false }), { status: 200 }))

    const { result } = renderHook(() => challengeLikes.isChallengeLiked(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeLikes.getChallengeLikeCount', () => {
  it('fetches the like count for a challenge', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ likeCount: 7 }), { status: 200 }))

    const { result } = renderHook(() => challengeLikes.getChallengeLikeCount(3), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ likeCount: 7 })
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/challenge/3/likeCount')
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ likeCount: 0 }), { status: 200 }))

    const { result } = renderHook(() => challengeLikes.getChallengeLikeCount(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeLikes.useLikeChallenge', () => {
  it('marks a challenge as liked and increments an unset like count to 1', async () => {
    stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => challengeLikes.useLikeChallenge(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['challenge', 3, 'isLiked'])).toEqual({ isLiked: true })
    expect(client.getQueryData(['challenge', 3, 'likeCount'])).toEqual({ likeCount: 1 })
  })

  it('increments an existing like count', async () => {
    stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['challenge', 3, 'likeCount'], { likeCount: 5 })

    const { result } = renderHook(() => challengeLikes.useLikeChallenge(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['challenge', 3, 'likeCount'])).toEqual({ likeCount: 6 })
  })
})

describe('challengeLikes.useUnlikeChallenge', () => {
  it.each([
    ['decrements an unset like count from a default of 1 to 0', undefined, 0],
    ['decrements an existing like count', 5, 4],
    ['never lets the like count go below zero', 0, 0],
  ] as const)('%s', async (_label, initialLikeCount, expectedLikeCount) => {
    stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()
    if (initialLikeCount !== undefined) {
      client.setQueryData(['challenge', 3, 'likeCount'], { likeCount: initialLikeCount })
    }

    const { result } = renderHook(() => challengeLikes.useUnlikeChallenge(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['challenge', 3, 'isLiked'])).toEqual({ isLiked: false })
    expect(client.getQueryData(['challenge', 3, 'likeCount'])).toEqual({
      likeCount: expectedLikeCount,
    })
  })
})
