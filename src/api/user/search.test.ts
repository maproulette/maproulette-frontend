// @vitest-environment happy-dom
import { useQuery } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { findUsersOptions } from './search'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('findUsersOptions', () => {
  it('URL-encodes special characters in the prefix', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => useQuery(findUsersOptions('john doe/weird', 3)), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.pathname).toBe(`/api/v2/users/find/${encodeURIComponent('john doe/weird')}`)
    expect(url.searchParams.get('limit')).toBe('3')
  })
})
