// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { challengeFavorites } from './favorites'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('challengeFavorites.isChallengeFavorited', () => {
  it('fetches the favorited status for a challenge', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ isFavorited: true }), { status: 200 })
    )

    const { result } = renderHook(() => challengeFavorites.isChallengeFavorited(3), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ isFavorited: true })
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/challenge/3/favorite')
  })

  it('is disabled when challengeId is falsy', () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify({ isFavorited: false }), { status: 200 })
    )

    const { result } = renderHook(() => challengeFavorites.isChallengeFavorited(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('challengeFavorites.useFavoriteChallenge', () => {
  it('marks a challenge as favorited on success', async () => {
    stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => challengeFavorites.useFavoriteChallenge(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['challenge', 3, 'isFavorited'])).toEqual({ isFavorited: true })
  })

  it("invalidates the user's saved challenges so the dashboard picks up the change", async () => {
    stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['user', 9, 'savedChallenges', { limit: 10, page: 0 }], [])

    const { result } = renderHook(() => challengeFavorites.useFavoriteChallenge(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(
      client.getQueryState(['user', 9, 'savedChallenges', { limit: 10, page: 0 }])?.isInvalidated
    ).toBe(true)
  })
})

describe('challengeFavorites.useUnfavoriteChallenge', () => {
  it('marks a challenge as unfavorited on success', async () => {
    stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => challengeFavorites.useUnfavoriteChallenge(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['challenge', 3, 'isFavorited'])).toEqual({ isFavorited: false })
  })

  it("invalidates the user's saved challenges so the dashboard picks up the change", async () => {
    stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['user', 9, 'savedChallenges', { limit: 10, page: 0 }], [])

    const { result } = renderHook(() => challengeFavorites.useUnfavoriteChallenge(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(
      client.getQueryState(['user', 9, 'savedChallenges', { limit: 10, page: 0 }])?.isInvalidated
    ).toBe(true)
  })
})
