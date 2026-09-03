// @vitest-environment happy-dom
import type { QueryClient } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import type { PublicUser } from '@/types/User'
import { FOLLOWER_STATUS, userFollow } from './follow'

afterEach(() => {
  vi.unstubAllGlobals()
})

const alice = { id: 3, osmProfile: { displayName: 'alice' } } as unknown as PublicUser

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

/** Records which query keys were invalidated, so the cache side effects can be asserted. */
const watchInvalidations = (queryClient: QueryClient) => {
  const keys: unknown[][] = []
  vi.spyOn(queryClient, 'invalidateQueries').mockImplementation((filters) => {
    keys.push((filters as { queryKey: unknown[] }).queryKey)
    return Promise.resolve()
  })
  return keys
}

describe('userFollow.following', () => {
  it('lists the users this user follows', async () => {
    const fetchMock = stubFetch(jsonResponse([alice]))

    const { result } = renderHook(() => userFollow.following(7), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([alice])
    expect(new URL(fetchMock.mock.calls[0][0].url).pathname).toBe('/api/v2/user/7/following')
  })

  it('copes with a body that is not a list', async () => {
    stubFetch(jsonResponse(null))

    const { result } = renderHook(() => userFollow.following(7), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('does not fetch without a user, or while switched off', () => {
    const fetchMock = stubFetch(jsonResponse([]))

    const { result: noUser } = renderHook(() => userFollow.following(0), {
      wrapper: queryClientWrapper(),
    })
    const { result: switchedOff } = renderHook(() => userFollow.following(7, { enabled: false }), {
      wrapper: queryClientWrapper(),
    })

    expect(noUser.current.fetchStatus).toBe('idle')
    expect(switchedOff.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userFollow.followers', () => {
  it('unwraps the follower envelope and keeps the reported status', async () => {
    stubFetch(
      jsonResponse([
        { user: alice, status: FOLLOWER_STATUS.blocked },
        { id: 4, osmProfile: { displayName: 'bob' } },
      ])
    )

    const { result } = renderHook(() => userFollow.followers(7), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      { user: alice, status: FOLLOWER_STATUS.blocked },
      { user: { id: 4, osmProfile: { displayName: 'bob' } }, status: FOLLOWER_STATUS.following },
    ])
  })

  it('copes with a body that is not a list', async () => {
    stubFetch(jsonResponse(null))

    const { result } = renderHook(() => userFollow.followers(7), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('does not fetch without a user, or while switched off', () => {
    const fetchMock = stubFetch(jsonResponse([]))

    const { result: noUser } = renderHook(() => userFollow.followers(0), {
      wrapper: queryClientWrapper(),
    })
    const { result: switchedOff } = renderHook(() => userFollow.followers(7, { enabled: false }), {
      wrapper: queryClientWrapper(),
    })

    expect(noUser.current.fetchStatus).toBe('idle')
    expect(switchedOff.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userFollow.useFollowUser', () => {
  it('follows the user and refreshes both sides of the relationship', async () => {
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidated = watchInvalidations(queryClient)

    const { result } = renderHook(() => userFollow.useFollowUser(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ userId: 3, currentUserId: 7 })

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('POST')
    expect(new URL(request.url).pathname).toBe('/api/v2/user/3/follow')
    expect(invalidated).toEqual([
      ['user', 3, 'followers'],
      ['user', 7, 'following'],
    ])
  })

  it('refreshes only the followed user when the follower is unknown', async () => {
    stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidated = watchInvalidations(queryClient)

    const { result } = renderHook(() => userFollow.useFollowUser(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ userId: 3 })

    expect(invalidated).toEqual([['user', 3, 'followers']])
  })
})

describe('userFollow.useUnfollowUser', () => {
  it('unfollows the user and refreshes both sides of the relationship', async () => {
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidated = watchInvalidations(queryClient)

    const { result } = renderHook(() => userFollow.useUnfollowUser(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ userId: 3, currentUserId: 7 })

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(new URL(request.url).pathname).toBe('/api/v2/user/3/follow')
    expect(invalidated).toEqual([
      ['user', 3, 'followers'],
      ['user', 7, 'following'],
    ])
  })
})

describe('userFollow.useBlockFollower', () => {
  it('blocks the follower and refreshes your own follower list', async () => {
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidated = watchInvalidations(queryClient)

    const { result } = renderHook(() => userFollow.useBlockFollower(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ userId: 3, currentUserId: 7 })

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('POST')
    expect(new URL(request.url).pathname).toBe('/api/v2/user/3/block')
    expect(invalidated).toEqual([['user', 7, 'followers']])
  })

  it('refreshes nothing when there is no current user to refresh for', async () => {
    stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidated = watchInvalidations(queryClient)

    const { result } = renderHook(() => userFollow.useBlockFollower(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ userId: 3 })

    expect(invalidated).toEqual([])
  })
})

describe('userFollow.useUnblockFollower', () => {
  it('unblocks the follower and refreshes your own follower list', async () => {
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidated = watchInvalidations(queryClient)

    const { result } = renderHook(() => userFollow.useUnblockFollower(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ userId: 3, currentUserId: 7 })

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(new URL(request.url).pathname).toBe('/api/v2/user/3/block')
    expect(invalidated).toEqual([['user', 7, 'followers']])
  })

  it('refreshes nothing when there is no current user to refresh for', async () => {
    stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidated = watchInvalidations(queryClient)

    const { result } = renderHook(() => userFollow.useUnblockFollower(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ userId: 3 })

    expect(invalidated).toEqual([])
  })
})
