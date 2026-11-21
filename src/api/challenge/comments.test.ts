// @vitest-environment happy-dom
import { useQuery } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { challengeTaskCommentsOptions } from './comments'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('challengeTaskCommentsOptions', () => {
  it('asks for every comment rather than the default first page', async () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => useQuery(challengeTaskCommentsOptions(3)), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).searchParams.get('limit')).toBe('-1')
  })
})
