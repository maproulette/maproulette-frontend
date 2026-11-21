// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { useLikeChallenge, useUnlikeChallenge } from './likes'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useLikeChallenge', () => {
  it('marks a challenge as liked and increments an unset like count to 1', async () => {
    stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => useLikeChallenge(), {
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

    const { result } = renderHook(() => useLikeChallenge(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['challenge', 3, 'likeCount'])).toEqual({ likeCount: 6 })
  })
})

describe('useUnlikeChallenge', () => {
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

    const { result } = renderHook(() => useUnlikeChallenge(), {
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
