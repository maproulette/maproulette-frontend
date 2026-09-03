// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { userProfile } from './profile'

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

describe('userProfile.getUser', () => {
  it('fetches a user by id', async () => {
    const user = { id: 5, osmProfile: { displayName: 'dave' } }
    const fetchMock = stubFetch(new Response(JSON.stringify(user), { status: 200 }))

    const { result } = renderHook(() => userProfile.getUser(5), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(user)
    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).pathname).toBe('/api/v2/user/5')
  })

  it('is disabled when userId is 0 (falsy)', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => userProfile.getUser(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userProfile.getPublicUser', () => {
  it('fetches a public user by id', async () => {
    const user = { id: 5, osmProfile: { displayName: 'dave' } }
    const fetchMock = stubFetch(new Response(JSON.stringify(user), { status: 200 }))

    const { result } = renderHook(() => userProfile.getPublicUser(5), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(user)
    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).pathname).toBe('/api/v2/user/5/public')
  })

  it('is disabled when userId is 0 (falsy)', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => userProfile.getPublicUser(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userProfile.activity', () => {
  it('fetches the current user activity log', async () => {
    const activity = [
      {
        id: 1,
        created: '2024-01-01',
        osmUserId: 1,
        typeId: 1,
        parentId: 1,
        parentName: 'p',
        itemId: 1,
        action: 1,
        status: 1,
        extra: '',
      },
    ]
    stubFetch(new Response(JSON.stringify(activity), { status: 200 }))

    const { result } = renderHook(() => userProfile.activity(), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(activity)
  })
})

describe('userProfile.metrics', () => {
  it('fetches metrics for a defined userId with the default monthDuration', async () => {
    const metrics = { total: 10 }
    const fetchMock = stubFetch(new Response(JSON.stringify(metrics), { status: 200 }))

    const { result } = renderHook(() => userProfile.metrics(9), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(metrics)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.pathname).toBe('/api/v2/data/user/9/metrics')
    expect(url.searchParams.get('monthDuration')).toBe('-1')
  })

  it('fetches metrics using a custom monthDuration', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({}), { status: 200 }))

    const { result } = renderHook(() => userProfile.metrics(9, 3), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).searchParams.get('monthDuration')).toBe('3')
  })

  it('is disabled when userId is undefined', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => userProfile.metrics(undefined), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userProfile.topChallenges', () => {
  it('fetches top challenges with default params', async () => {
    const challenges = [{ id: 1, name: 'Challenge 1' }]
    const fetchMock = stubFetch(new Response(JSON.stringify(challenges), { status: 200 }))

    const { result } = renderHook(() => userProfile.topChallenges(9), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(challenges)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.pathname).toBe('/api/v2/data/user/9/topChallenges')
    expect(url.searchParams.get('monthDuration')).toBe('-1')
    expect(url.searchParams.get('limit')).toBe('10')
    expect(url.searchParams.get('offset')).toBe('0')
  })

  it('fetches top challenges with custom params', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(
      () => userProfile.topChallenges(9, { monthDuration: 6, limit: 3, offset: 2 }),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.searchParams.get('monthDuration')).toBe('6')
    expect(url.searchParams.get('limit')).toBe('3')
    expect(url.searchParams.get('offset')).toBe('2')
  })

  it('is disabled when userId is undefined', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => userProfile.topChallenges(undefined), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userProfile.savedChallenges', () => {
  it('fetches saved challenges with default limit/page', async () => {
    const challenges = [{ id: 2, name: 'Saved Challenge' }]
    const fetchMock = stubFetch(new Response(JSON.stringify(challenges), { status: 200 }))

    const { result } = renderHook(() => userProfile.savedChallenges(9), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(challenges)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.pathname).toBe('/api/v2/user/9/saved')
    expect(url.searchParams.get('limit')).toBe('10')
    expect(url.searchParams.get('page')).toBe('0')
  })

  it('fetches saved challenges using custom limit/page', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => userProfile.savedChallenges(9, 20, 1), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.searchParams.get('limit')).toBe('20')
    expect(url.searchParams.get('page')).toBe('1')
  })

  it('is disabled when userId is undefined', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => userProfile.savedChallenges(undefined), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userProfile.savedTasks', () => {
  it('fetches saved tasks with default limit/page', async () => {
    const tasks = [{ id: 3, name: 'Saved Task' }]
    const fetchMock = stubFetch(new Response(JSON.stringify(tasks), { status: 200 }))

    const { result } = renderHook(() => userProfile.savedTasks(9), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(tasks)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.pathname).toBe('/api/v2/user/9/savedTasks')
    expect(url.searchParams.get('limit')).toBe('10')
    expect(url.searchParams.get('page')).toBe('0')
  })

  it('fetches saved tasks using custom limit/page', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => userProfile.savedTasks(9, 15, 2), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.searchParams.get('limit')).toBe('15')
    expect(url.searchParams.get('page')).toBe('2')
  })

  it('is disabled when userId is undefined', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => userProfile.savedTasks(undefined), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userProfile.lockedTasks', () => {
  it('fetches locked tasks with the default limit', async () => {
    const locked = [{ taskId: 1, userId: 9 }]
    const fetchMock = stubFetch(new Response(JSON.stringify(locked), { status: 200 }))

    const { result } = renderHook(() => userProfile.lockedTasks(9), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(locked)
    const [request] = fetchMock.mock.calls[0]
    const url = new URL(request.url)
    expect(url.pathname).toBe('/api/v2/user/9/lockedTasks')
    expect(url.searchParams.get('limit')).toBe('50')
  })

  it('fetches locked tasks using a custom limit', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => userProfile.lockedTasks(9, 5), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).searchParams.get('limit')).toBe('5')
  })

  it('is disabled when userId is undefined', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => userProfile.lockedTasks(undefined), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userProfile.teamMemberships', () => {
  it('fetches team memberships for a defined userId', async () => {
    const memberships = [{ teamId: 1, userId: 9 }]
    const fetchMock = stubFetch(new Response(JSON.stringify(memberships), { status: 200 }))

    const { result } = renderHook(() => userProfile.teamMemberships(9), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(memberships)
    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).pathname).toBe('/api/v2/team/all/user/9/memberships')
  })

  it('is disabled when userId is undefined', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => userProfile.teamMemberships(undefined), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userProfile.useUpdateUserSettings', () => {
  it('updates settings without properties and refreshes the whoami cache', async () => {
    const updatedUser = { id: 9, osmProfile: { displayName: 'dave' } }
    const { fetchMock, bodies } = stubFetchCapturingBody(
      new Response(JSON.stringify(updatedUser), { status: 200 })
    )
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => userProfile.useUpdateUserSettings(), {
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

    const { result } = renderHook(() => userProfile.useUpdateUserSettings(), {
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

    const { result } = renderHook(() => userProfile.useUpdateUserSettings(), {
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

    const { result } = renderHook(() => userProfile.useUpdateUserSettings(), {
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

    const { result } = renderHook(() => userProfile.useUpdateUserSettings(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate({ userId: 9, settings: { defaultBasemap: 2 } })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(queryClient.getQueryData(['user', 'whoami'])).toBeUndefined()
  })
})

describe('userProfile.useUnsaveChallenge', () => {
  it('unsaves the challenge and refreshes the saved list', async () => {
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateQueries = vi
      .spyOn(queryClient, 'invalidateQueries')
      .mockResolvedValue(undefined)

    const { result } = renderHook(() => userProfile.useUnsaveChallenge(), {
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

describe('userProfile.useRegenerateApiKey', () => {
  it('regenerates the api key and updates/invalidates the whoami and user caches', async () => {
    const updatedUser = { id: 9, apiKey: 'new-key' }
    const fetchMock = stubFetch(new Response(JSON.stringify(updatedUser), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => userProfile.useRegenerateApiKey(), {
      wrapper: queryClientWrapper(queryClient),
    })

    result.current.mutate(9)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(updatedUser)
    expect(queryClient.getQueryData(['user', 'whoami'])).toEqual(updatedUser)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user', 9] })

    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).pathname).toBe('/api/v2/user/9/apikey')
  })
})
