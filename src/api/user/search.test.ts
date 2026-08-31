// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { userSearch } from './search'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('userSearch.findUsers', () => {
  it('fetches matching users with the default limit', async () => {
    const users = [
      { id: 1, osmId: 111, displayName: 'alice', avatarURL: 'https://example.com/a.png' },
    ]
    const fetchMock = stubFetch(new Response(JSON.stringify(users), { status: 200 }))

    const { result } = renderHook(() => userSearch.findUsers('ali'), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(users)

    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.pathname).toBe('/api/v2/users/find/ali')
    expect(url.searchParams.get('limit')).toBe('10')
  })

  it('URL-encodes special characters in the prefix', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => userSearch.findUsers('john doe/weird', 3), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.pathname).toBe(`/api/v2/users/find/${encodeURIComponent('john doe/weird')}`)
    expect(url.searchParams.get('limit')).toBe('3')
  })

  it('is disabled when the prefix is empty, even if enabled is true', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => userSearch.findUsers('', 10, true), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('is disabled when enabled is explicitly false, even with a non-empty prefix', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => userSearch.findUsers('ali', 10, false), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
