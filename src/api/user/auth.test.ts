// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { userAuth } from './auth'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('userAuth.signOut', () => {
  it('calls the signout endpoint', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 200 }))

    await userAuth.signOut()

    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).pathname).toBe('/auth/signout')
  })
})

describe('userAuth.callback', () => {
  it('sends the code and state, and no redirect_uri', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ token: 'abc' }), { status: 200 }))

    const result = await userAuth.callback('the/code', 'the-state')

    expect(result).toEqual({ token: 'abc' })
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.pathname).toBe('/auth/callback')
    expect(url.searchParams.get('code')).toBe('the/code')
    expect(url.searchParams.get('state')).toBe('the-state')
    expect(url.searchParams.has('redirect_uri')).toBe(false)
  })
})

describe('userAuth.whoAmI', () => {
  it('fetches the current user when not logged out', async () => {
    const whoami = { id: 1, osmProfile: { displayName: 'alice' } }
    stubFetch(new Response(JSON.stringify(whoami), { status: 200 }))

    const { result } = renderHook(() => userAuth.whoAmI(false), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(whoami)
  })

  it('is disabled when the user is logged out', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => userAuth.whoAmI(true), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userAuth.refreshAuth', () => {
  it('invalidates the whoami query and all user queries', async () => {
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    await userAuth.refreshAuth(queryClient)

    expect(invalidateSpy).toHaveBeenNthCalledWith(1, { queryKey: ['user', 'whoami'] })
    expect(invalidateSpy).toHaveBeenNthCalledWith(2, { queryKey: ['user'] })
  })
})

describe('userAuth.clearAuth', () => {
  it('clears all cached data', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['user', 'whoami'], { id: 1 })
    queryClient.setQueryData(['user', 1, 'lockedTasks'], [{ id: 7 }])
    queryClient.setQueryData(['challenge', 5], { id: 5, isFavorite: true })

    userAuth.clearAuth(queryClient)

    expect(queryClient.getQueryData(['user', 'whoami'])).toBeUndefined()
    expect(queryClient.getQueryData(['user', 1, 'lockedTasks'])).toBeUndefined()
    expect(queryClient.getQueryData(['challenge', 5])).toBeUndefined()
  })
})
