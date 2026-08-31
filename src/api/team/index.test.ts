// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { team } from './index'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('team.get', () => {
  it('fetches a team by id', async () => {
    stubFetch(new Response(JSON.stringify({ id: 1, name: 'Alpha' }), { status: 200 }))

    const { result } = renderHook(() => team.get(1), { wrapper: queryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ id: 1, name: 'Alpha' })
  })

  it('is disabled when teamId is undefined', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => team.get(undefined), { wrapper: queryClientWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('team.useCreateTeam', () => {
  it('creates a team and invalidates user queries', async () => {
    const created = { id: 5, name: 'New Team' }
    stubFetch(new Response(JSON.stringify(created), { status: 200 }))
    const queryClient = queryClientWrapper()

    const { result } = renderHook(() => team.useCreateTeam(), { wrapper: queryClient })

    result.current.mutate({ name: 'New Team' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(created)
  })

  // The backend's shared Group JSON reader requires `id` and `groupType` to
  // be present in the request body (even though it discards both), so
  // omitting them makes this endpoint 400. See the comment on useCreateTeam.
  it('sends placeholder id and groupType fields required by the backend', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ id: 5, name: 'New Team' })))

    const { result } = renderHook(() => team.useCreateTeam(), { wrapper: queryClientWrapper() })
    result.current.mutate({ name: 'New Team' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    const body = JSON.parse(await request.clone().text())
    expect(body).toEqual({ id: 0, groupType: 0, name: 'New Team' })
  })
})

describe('team.members', () => {
  it('fetches a team by id', async () => {
    const members = [{ id: 1, name: 'Alice' }]
    const fetchMock = stubFetch(new Response(JSON.stringify(members), { status: 200 }))

    const { result } = renderHook(() => team.members(1), { wrapper: queryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(members)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/team/1/userMembers')
  })

  it('is disabled when teamId is undefined', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => team.members(undefined), { wrapper: queryClientWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('team.findTeamsByName', () => {
  it('finds teams matching a query string', async () => {
    const teams = [{ id: 1, name: 'Alpha' }]
    const fetchMock = stubFetch(new Response(JSON.stringify(teams), { status: 200 }))

    const { result } = renderHook(() => team.findTeamsByName('alp'), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(teams)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('query=alp')
  })

  it('is disabled when the query string is empty', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => team.findTeamsByName(''), { wrapper: queryClientWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('is disabled when explicitly passed enabled: false, even with a non-empty query', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => team.findTeamsByName('alp', false), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('team.useUpdateTeam', () => {
  it('updates a team and invalidates its query', async () => {
    const updated = { id: 3, name: 'Updated Team' }
    const fetchMock = stubFetch(new Response(JSON.stringify(updated), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => team.useUpdateTeam(), {
      wrapper: queryClientWrapper(queryClient),
    })
    result.current.mutate({ teamId: 3, payload: { name: 'Updated Team' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(updated)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team', 3] })
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    expect(request.url).toContain('api/v2/team/3')
  })

  it('sends placeholder id and groupType fields required by the backend', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify({ id: 3, name: 'Updated Team' })))

    const { result } = renderHook(() => team.useUpdateTeam(), { wrapper: queryClientWrapper() })
    result.current.mutate({ teamId: 3, payload: { name: 'Updated Team' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    const body = JSON.parse(await request.clone().text())
    expect(body).toEqual({ id: 3, groupType: 0, name: 'Updated Team' })
  })
})

describe('team.useDeleteTeam', () => {
  it('deletes a team and invalidates user and team queries', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => team.useDeleteTeam(), {
      wrapper: queryClientWrapper(queryClient),
    })
    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user'] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team'] })
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(request.url).toContain('api/v2/team/3')
  })
})

describe('team.useInviteMember', () => {
  it('invites a member and invalidates the team members query', async () => {
    const invited = { id: 1, userId: 7, teamId: 3 }
    const fetchMock = stubFetch(new Response(JSON.stringify(invited), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => team.useInviteMember(), {
      wrapper: queryClientWrapper(queryClient),
    })
    result.current.mutate({ teamId: 3, userId: 7, role: 1 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(invited)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team', 3, 'members'] })
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    expect(request.url).toContain('api/v2/team/3/user/7/invite/1')
  })
})

describe('team.useAcceptInvite', () => {
  it('accepts an invite and invalidates team and user queries', async () => {
    const accepted = { id: 1, userId: 7, teamId: 3 }
    const fetchMock = stubFetch(new Response(JSON.stringify(accepted), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => team.useAcceptInvite(), {
      wrapper: queryClientWrapper(queryClient),
    })
    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(accepted)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team', 3] })
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user'] })
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    expect(request.url).toContain('api/v2/team/3/invite/accept')
  })
})

describe('team.useDeclineInvite', () => {
  it('declines an invite and invalidates user queries', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => team.useDeclineInvite(), {
      wrapper: queryClientWrapper(queryClient),
    })
    result.current.mutate(3)

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['user'] })
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(request.url).toContain('api/v2/team/3/invite')
  })
})

describe('team.useChangeRole', () => {
  it("changes a member's role and invalidates the team members query", async () => {
    const changed = { id: 1, userId: 7, teamId: 3 }
    const fetchMock = stubFetch(new Response(JSON.stringify(changed), { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => team.useChangeRole(), {
      wrapper: queryClientWrapper(queryClient),
    })
    result.current.mutate({ teamId: 3, userId: 7, role: 2 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(changed)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team', 3, 'members'] })
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    expect(request.url).toContain('api/v2/team/3/user/7/role/2')
  })
})

describe('team.useRemoveMember', () => {
  it('removes a member and invalidates the team members query', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => team.useRemoveMember(), {
      wrapper: queryClientWrapper(queryClient),
    })
    result.current.mutate({ teamId: 3, userId: 7 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['team', 3, 'members'] })
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(request.url).toContain('api/v2/team/3/user/7/')
  })
})
