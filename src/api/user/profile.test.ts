// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { useUnsaveChallenge, useUpdateUserSettings } from './profile'

// Captures each request body as text (via a clone, so ky's own read of the
// original is unaffected) at mock-invocation time — reading the body from
// `fetchMock.mock.calls` after the fact is unreliable, since ky/undici may
// have already consumed the stream by then.
function stubFetchCapturingBody(response: Response) {
  const bodies: string[] = []
  const fetchMock = vi.fn(async (request: Request) => {
    bodies.push(await request.clone().text())
    return response
  })
  vi.stubGlobal('fetch', fetchMock)
  return { fetchMock, bodies }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useUpdateUserSettings', () => {
  it('updates settings without properties and refreshes the whoami cache', async () => {
    const updatedUser = { id: 9, osmProfile: { displayName: 'dave' } }
    const { fetchMock, bodies } = stubFetchCapturingBody(
      new Response(JSON.stringify(updatedUser), { status: 200 })
    )
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useUpdateUserSettings(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ userId: 9, settings: { defaultBasemap: 1 } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(updatedUser)
    expect(queryClient.getQueryData(['user', 'whoami'])).toEqual(updatedUser)

    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).pathname).toBe('/api/v2/user/9')
    expect(JSON.parse(bodies[0])).toEqual({ defaultBasemap: 1 })
  })

  it('sends properties as a JSON object when provided', async () => {
    const updatedUser = { id: 9 }
    const { bodies } = stubFetchCapturingBody(
      new Response(JSON.stringify(updatedUser), { status: 200 })
    )

    const { result } = renderHook(() => useUpdateUserSettings(), {
      wrapper: queryClientWrapper(),
    })

    result.current.mutate({
      userId: 9,
      settings: { defaultBasemap: 1 },
      properties: { theme: 'dark' },
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(JSON.parse(bodies[0])).toEqual({
      defaultBasemap: 1,
      properties: { theme: 'dark' },
    })
  })

  it('patches the cached user before the request resolves', async () => {
    let releaseResponse: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    const fetchMock = vi.fn(async (_request: Request) => {
      await pending
      return new Response(JSON.stringify({ id: 9, properties: { theme: 'dark' } }), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['user', 'whoami'], {
      id: 9,
      settings: { defaultBasemap: 1 },
      properties: { theme: 'light' },
    })

    const { result } = renderHook(() => useUpdateUserSettings(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({
      userId: 9,
      settings: { defaultBasemap: 2 },
      properties: { theme: 'dark' },
    })

    await waitFor(() =>
      expect(queryClient.getQueryData(['user', 'whoami'])).toEqual({
        id: 9,
        settings: { defaultBasemap: 2 },
        properties: { theme: 'dark' },
      })
    )
    expect(result.current.isPending).toBe(true)

    releaseResponse()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('restores the cached user when the request fails', async () => {
    stubFetch(new Response('nope', { status: 500 }))
    const queryClient = createTestQueryClient()
    const cachedUser = {
      id: 9,
      settings: { defaultBasemap: 1 },
      properties: { theme: 'light' },
    }
    queryClient.setQueryData(['user', 'whoami'], cachedUser)

    const { result } = renderHook(() => useUpdateUserSettings(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({
      userId: 9,
      settings: { defaultBasemap: 2 },
      properties: { theme: 'dark' },
    })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(queryClient.getQueryData(['user', 'whoami'])).toEqual(cachedUser)
  })

  it('has nothing to restore when the request fails with no cached user', async () => {
    stubFetch(new Response('nope', { status: 500 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useUpdateUserSettings(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ userId: 9, settings: { defaultBasemap: 2 } })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(queryClient.getQueryData(['user', 'whoami'])).toBeUndefined()
  })
})

describe('useUnsaveChallenge', () => {
  it('unsaves the challenge and refreshes the saved list', async () => {
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined)

    const { result } = renderHook(() => useUnsaveChallenge(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ userId: 9, challengeId: 42 })

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(new URL(request.url).pathname).toBe('/api/v2/user/9/unsave/42')
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ['user', 9, 'savedChallenges'],
    })
  })
})
