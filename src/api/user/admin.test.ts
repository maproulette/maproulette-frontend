// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { userAdmin } from './admin'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('userAdmin.getAllUsers', () => {
  it('fetches users with default limit/page when no params are given', async () => {
    const users = [
      { id: 1, osmProfile: { displayName: 'alice' } },
      { id: 2, osmProfile: { displayName: 'bob' } },
    ]
    const fetchMock = stubFetch(new Response(JSON.stringify(users), { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => userAdmin.getAllUsers(), {
      wrapper: queryClientWrapper(queryClient),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(users)

    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.searchParams.get('limit')).toBe('50')
    expect(url.searchParams.get('page')).toBe('0')
  })

  it('fetches users using the provided limit/page params', async () => {
    const users = [{ id: 3, osmProfile: { displayName: 'carol' } }]
    const fetchMock = stubFetch(new Response(JSON.stringify(users), { status: 200 }))

    const { result } = renderHook(() => userAdmin.getAllUsers({ limit: 5, page: 2 }), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.searchParams.get('limit')).toBe('5')
    expect(url.searchParams.get('page')).toBe('2')
  })
})

describe('userAdmin.getSuperUsers', () => {
  it('fetches the list of super user ids', async () => {
    stubFetch(new Response(JSON.stringify([1, 2, 3]), { status: 200 }))

    const { result } = renderHook(() => userAdmin.getSuperUsers(), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([1, 2, 3])
  })
})
