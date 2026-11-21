// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient } from '@/test/queryClient'
import { stubFetch } from '@/test/stubFetch'
import { clearAuth, oauthCallback } from './auth'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('oauthCallback', () => {
  it('sends the code and state, and no redirect_uri', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ token: 'abc' }), { status: 200 }))

    const result = await oauthCallback('the/code', 'the-state')

    expect(result).toEqual({ token: 'abc' })
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.pathname).toBe('/auth/callback')
    expect(url.searchParams.get('code')).toBe('the/code')
    expect(url.searchParams.get('state')).toBe('the-state')
    expect(url.searchParams.has('redirect_uri')).toBe(false)
  })
})

describe('clearAuth', () => {
  it('clears all cached data', () => {
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['user', 'whoami'], { id: 1 })
    queryClient.setQueryData(['user', 1, 'lockedTasks'], [{ id: 7 }])
    queryClient.setQueryData(['challenge', 5], { id: 5, isFavorite: true })

    clearAuth(queryClient)

    expect(queryClient.getQueryData(['user', 'whoami'])).toBeUndefined()
    expect(queryClient.getQueryData(['user', 1, 'lockedTasks'])).toBeUndefined()
    expect(queryClient.getQueryData(['challenge', 5])).toBeUndefined()
  })
})
