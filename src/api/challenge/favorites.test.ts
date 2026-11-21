// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { useFavoriteChallenge, useUnfavoriteChallenge } from './favorites'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useFavoriteChallenge', () => {
  it('marks a challenge as favorited on success', async () => {
    stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => useFavoriteChallenge(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['challenge', 3, 'isFavorited'])).toEqual({ isFavorited: true })
  })
})

describe('useUnfavoriteChallenge', () => {
  it('marks a challenge as unfavorited on success', async () => {
    stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => useUnfavoriteChallenge(), {
      wrapper: queryClientWrapper(client),
    })

    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['challenge', 3, 'isFavorited'])).toEqual({ isFavorited: false })
  })
})
