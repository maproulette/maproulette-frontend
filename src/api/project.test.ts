// @vitest-environment happy-dom
import { useQuery } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { project } from './project'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const projectA = { id: 1, name: 'Project A', enabled: true }
const projectB = { id: 2, name: 'Project B', enabled: true }

describe('project.featuredProjects', () => {
  it('fetches featured projects with default params and seeds the per-project cache', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([projectA, projectB]), { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => project.featuredProjects(), {
      wrapper: queryClientWrapper(client),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([projectA, projectB])
    expect(client.getQueryData(['project', 1])).toEqual(projectA)
    expect(client.getQueryData(['project', 2])).toEqual(projectB)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('limit=10')
    expect(request.url).toContain('onlyEnabled=true')
    expect(request.url).toContain('page=0')
  })

  it('honors explicit limit, onlyEnabled, and page params', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    renderHook(() => project.featuredProjects({ limit: 5, onlyEnabled: false, page: 2 }), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('limit=5')
    expect(request.url).toContain('onlyEnabled=false')
    expect(request.url).toContain('page=2')
  })
})

describe('project.getProject', () => {
  it('fetches a project by id', async () => {
    stubFetch(new Response(JSON.stringify(projectA), { status: 200 }))

    const { result } = renderHook(() => project.getProject(1), { wrapper: queryClientWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(projectA)
  })

  it('is disabled when projectId is undefined', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => project.getProject(undefined), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('project.getProjectOptions', () => {
  it('builds the expected query key', () => {
    expect(project.getProjectOptions(7).queryKey).toEqual(['project', 7])
  })

  it('fetches a project by id when used as query options', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify(projectA), { status: 200 }))

    const { result } = renderHook(() => useQuery(project.getProjectOptions(1)), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(projectA)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/project/1')
  })
})

describe('project.getManagedProjects', () => {
  it('fetches managed projects with default params and seeds the per-project cache', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([projectA, projectB]), { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => project.getManagedProjects(), {
      wrapper: queryClientWrapper(client),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([projectA, projectB])
    expect(client.getQueryData(['project', 1])).toEqual(projectA)
    expect(client.getQueryData(['project', 2])).toEqual(projectB)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('limit=50')
    expect(request.url).toContain('page=0')
    expect(request.url).toContain('onlyEnabled=false')
    expect(request.url).toContain('onlyOwned=false')
  })

  it('honors explicit limit, page, onlyEnabled, onlyOwned, and searchString params', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    renderHook(
      () =>
        project.getManagedProjects({
          limit: 5,
          page: 1,
          onlyEnabled: true,
          onlyOwned: true,
          searchString: 'road',
        }),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('limit=5')
    expect(request.url).toContain('page=1')
    expect(request.url).toContain('onlyEnabled=true')
    expect(request.url).toContain('onlyOwned=true')
    expect(request.url).toContain('searchString=road')
  })

  it('uses previous data as a placeholder while refetching with new params', async () => {
    const responses = [
      new Response(JSON.stringify([projectA]), { status: 200 }),
      new Response(JSON.stringify([projectB]), { status: 200 }),
    ]
    let call = 0
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_request: Request) => responses[call++])
    )

    const { result, rerender } = renderHook(
      (page: number) => project.getManagedProjects({ page }),
      {
        wrapper: queryClientWrapper(),
        initialProps: 0,
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([projectA])

    rerender(1)
    await waitFor(() => expect(result.current.data).toEqual([projectB]))
  })
})

describe('project.getProjectChallengesOptions', () => {
  it('builds the expected query key with default limit/page', () => {
    expect(project.getProjectChallengesOptions(3).queryKey).toEqual([
      'project',
      'challenges',
      3,
      { limit: 100, page: 0 },
    ])
  })

  it('fetches project challenges with explicit limit/page when used as query options', async () => {
    const challenges = [{ id: 10, name: 'Challenge A' }]
    const fetchMock = stubFetch(new Response(JSON.stringify(challenges), { status: 200 }))

    const { result } = renderHook(() => useQuery(project.getProjectChallengesOptions(3, 5, 1)), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(challenges)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/project/3/challenges')
    expect(request.url).toContain('limit=5')
    expect(request.url).toContain('page=1')
  })

  it('is disabled when projectId is falsy', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => useQuery(project.getProjectChallengesOptions(0)), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('project.getProjectChallenges', () => {
  it('fetches challenges for a project and seeds the per-challenge cache', async () => {
    const challengeA = { id: 10, name: 'Challenge A' }
    const challengeB = { id: 11, name: 'Challenge B' }
    const fetchMock = stubFetch(
      new Response(JSON.stringify([challengeA, challengeB]), { status: 200 })
    )
    const client = createTestQueryClient()

    const { result } = renderHook(() => project.getProjectChallenges(3), {
      wrapper: queryClientWrapper(client),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([challengeA, challengeB])
    expect(client.getQueryData(['challenge', 10])).toEqual(challengeA)
    expect(client.getQueryData(['challenge', 11])).toEqual(challengeB)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/project/3/challenges')
    expect(request.url).toContain('limit=100')
    expect(request.url).toContain('page=0')
  })

  it('is disabled when projectId is undefined', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => project.getProjectChallenges(undefined), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('project.searchProjects', () => {
  it('is disabled when search is empty', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => project.searchProjects(), { wrapper: queryClientWrapper() })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches matching projects and seeds the per-project cache when a search term is given', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([projectA]), { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => project.searchProjects({ search: 'road' }), {
      wrapper: queryClientWrapper(client),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([projectA])
    expect(client.getQueryData(['project', 1])).toEqual(projectA)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('search=road')
  })
})

describe('project.exportProjectTasksCsv', () => {
  it('downloads the CSV using a default filename derived from the project id', async () => {
    stubFetch(new Response('id,name\n1,Task', { status: 200 }))
    const anchor = document.createElement('a')
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    await project.exportProjectTasksCsv(42)

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1)
    expect(anchor.href).toBe('blob:mock-url')
    expect(anchor.download).toBe('project-42-tasks.csv')
    expect(clickSpy).toHaveBeenCalledTimes(1)
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url')

    vi.restoreAllMocks()
  })

  it('uses a custom filename when provided', async () => {
    stubFetch(new Response('id,name\n1,Task', { status: 200 }))
    const anchor = document.createElement('a')
    vi.spyOn(anchor, 'click').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    await project.exportProjectTasksCsv(42, 'custom-name.csv')

    expect(anchor.download).toBe('custom-name.csv')

    vi.restoreAllMocks()
  })
})

describe('project.useCreateProject', () => {
  it('seeds the new project by id and prepends it to a cached managed list', async () => {
    const created = { id: 9, name: 'Created', enabled: true }
    stubFetch(new Response(JSON.stringify(created), { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['project', 'managed', 'seed'], [projectA])

    const { result } = renderHook(() => project.useCreateProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ name: 'Created' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['project', 9])).toEqual(created)
    expect(client.getQueryData(['project', 'managed', 'seed'])).toEqual([created, projectA])
  })

  it('creates a sole-entry managed list when no managed data is cached yet', async () => {
    const created = { id: 9, name: 'Created', enabled: true }
    stubFetch(new Response(JSON.stringify(created), { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['project', 'managed', 'seed'], [projectA])
    await client.resetQueries({ queryKey: ['project', 'managed', 'seed'] })
    expect(client.getQueryData(['project', 'managed', 'seed'])).toBeUndefined()

    const { result } = renderHook(() => project.useCreateProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ name: 'Created' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['project', 'managed', 'seed'])).toEqual([created])
  })
})

describe('project.useUpdateProject', () => {
  it('updates the cached project and replaces the matching entry in managed lists', async () => {
    const updated = { id: 1, name: 'Updated', enabled: true }
    const fetchMock = stubFetch(new Response(JSON.stringify(updated), { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['project', 'managed', 'seed'], [projectA, projectB])

    const { result } = renderHook(() => project.useUpdateProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ projectId: 1, updates: { name: 'Updated' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['project', 1])).toEqual(updated)
    expect(client.getQueryData(['project', 'managed', 'seed'])).toEqual([updated, projectB])
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    expect(request.url).toContain('api/v2/project/1')
  })

  it('leaves a not-yet-cached managed list untouched', async () => {
    const updated = { id: 1, name: 'Updated', enabled: true }
    stubFetch(new Response(JSON.stringify(updated), { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['project', 'managed', 'seed'], [projectA, projectB])
    await client.resetQueries({ queryKey: ['project', 'managed', 'seed'] })

    const { result } = renderHook(() => project.useUpdateProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ projectId: 1, updates: { name: 'Updated' } })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['project', 'managed', 'seed'])).toBeUndefined()
  })

  it('patches the cached project and managed lists before the request resolves', async () => {
    let releaseResponse: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    const fetchMock = vi.fn(async (_request: Request) => {
      await pending
      return new Response(JSON.stringify({ id: 1, name: 'Project A', enabled: false }), {
        status: 200,
      })
    })
    vi.stubGlobal('fetch', fetchMock)
    const client = createTestQueryClient()
    client.setQueryData(['project', 1], projectA)
    client.setQueryData(['project', 'managed', 'seed'], [projectA, projectB])

    const { result } = renderHook(() => project.useUpdateProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ projectId: 1, updates: { enabled: false } })

    await waitFor(() =>
      expect(client.getQueryData(['project', 1])).toEqual({ ...projectA, enabled: false })
    )
    expect(client.getQueryData(['project', 'managed', 'seed'])).toEqual([
      { ...projectA, enabled: false },
      projectB,
    ])
    expect(result.current.isPending).toBe(true)

    releaseResponse()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('restores the cached project and managed lists when the request fails', async () => {
    stubFetch(new Response('nope', { status: 500 }))
    const client = createTestQueryClient()
    client.setQueryData(['project', 1], projectA)
    client.setQueryData(['project', 'managed', 'seed'], [projectA, projectB])

    const { result } = renderHook(() => project.useUpdateProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ projectId: 1, updates: { enabled: false } })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(client.getQueryData(['project', 1])).toEqual(projectA)
    expect(client.getQueryData(['project', 'managed', 'seed'])).toEqual([projectA, projectB])
  })

  it('restores nothing when the optimistic snapshot could not be taken', async () => {
    stubFetch(new Response(JSON.stringify(projectA), { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['project', 1], projectA)
    vi.spyOn(client, 'getQueriesData').mockImplementation(() => {
      throw new Error('cache unavailable')
    })

    const { result } = renderHook(() => project.useUpdateProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ projectId: 1, updates: { enabled: false } })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData(['project', 1])).toEqual(projectA)
  })

  it('has nothing to restore when the failed update had nothing cached', async () => {
    stubFetch(new Response('nope', { status: 500 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => project.useUpdateProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ projectId: 1, updates: { enabled: false } })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(client.getQueryData(['project', 1])).toBeUndefined()
  })
})

describe('project.useDeleteProject', () => {
  it('removes the project query and filters it out of cached managed lists', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['project', 5], projectA)
    client.setQueryData(['project', 'managed', 'seed'], [{ id: 5, name: 'Gone' }, projectB])

    const { result } = renderHook(() => project.useDeleteProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ projectId: 5 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['project', 5])).toBeUndefined()
    expect(client.getQueryData(['project', 'managed', 'seed'])).toEqual([projectB])
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(request.url).not.toContain('immediate')
  })

  it('passes immediate=true as a search param when requested', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 200 }))

    const { result } = renderHook(() => project.useDeleteProject(), {
      wrapper: queryClientWrapper(),
    })
    result.current.mutate({ projectId: 5, immediate: true })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('immediate=true')
  })

  it('leaves a not-yet-cached managed list untouched', async () => {
    stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['project', 'managed', 'seed'], [projectA, projectB])
    await client.resetQueries({ queryKey: ['project', 'managed', 'seed'] })

    const { result } = renderHook(() => project.useDeleteProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ projectId: 1 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['project', 'managed', 'seed'])).toBeUndefined()
  })
})

describe('project.getProjectStats', () => {
  it('fetches project stats', async () => {
    const stats = { id: 4, name: 'Project D', actions: { total: 10 } }
    stubFetch(new Response(JSON.stringify(stats), { status: 200 }))

    const { result } = renderHook(() => project.getProjectStats(4), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(stats)
  })

  it('is disabled when projectId is undefined', () => {
    const fetchMock = stubFetch(new Response('{}', { status: 200 }))

    const { result } = renderHook(() => project.getProjectStats(undefined), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('project.managers', () => {
  it('normalises the manager shapes the backend returns', async () => {
    const fetchMock = stubFetch(
      new Response(
        JSON.stringify([
          {
            userId: 7,
            osmProfile: { displayName: 'alice', avatarURL: 'https://osm/alice.png' },
            roles: [1],
          },
          { id: 8, grants: [{ role: 2 }, { role: 3 }], displayName: 'bob' },
          {},
        ]),
        { status: 200 }
      )
    )

    const { result } = renderHook(() => project.managers(4), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      {
        userId: 7,
        avatarURL: 'https://osm/alice.png',
        displayName: 'alice',
        roles: [1],
      },
      { userId: 8, avatarURL: undefined, displayName: 'bob', roles: [2, 3] },
      { userId: 0, avatarURL: undefined, displayName: 'User 0', roles: [] },
    ])
    expect(new URL(fetchMock.mock.calls[0][0].url).pathname).toBe('/api/v2/user/project/4')
  })

  it('copes with a body that is not a list', async () => {
    stubFetch(new Response('null', { status: 200 }))

    const { result } = renderHook(() => project.managers(4), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('does not fetch without a project, or while switched off', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result: noProject } = renderHook(() => project.managers(0), {
      wrapper: queryClientWrapper(),
    })
    const { result: switchedOff } = renderHook(() => project.managers(4, { enabled: false }), {
      wrapper: queryClientWrapper(),
    })

    expect(noProject.current.fetchStatus).toBe('idle')
    expect(switchedOff.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('project.teamManagers', () => {
  it('flattens each team grant down to the roles it carries', async () => {
    const team = { id: 2, name: 'Team' }
    const fetchMock = stubFetch(
      new Response(JSON.stringify([{ team, grants: [{ role: 1 }, { role: 2 }] }, { team }]), {
        status: 200,
      })
    )

    const { result } = renderHook(() => project.teamManagers(4), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      { team, roles: [1, 2] },
      { team, roles: [] },
    ])
    expect(new URL(fetchMock.mock.calls[0][0].url).pathname).toBe('/api/v2/teams/projectManagers/4')
  })

  it('copes with a body that is not a list', async () => {
    stubFetch(new Response('null', { status: 200 }))

    const { result } = renderHook(() => project.teamManagers(4), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('does not fetch without a project, or while switched off', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result: noProject } = renderHook(() => project.teamManagers(0), {
      wrapper: queryClientWrapper(),
    })
    const { result: switchedOff } = renderHook(() => project.teamManagers(4, { enabled: false }), {
      wrapper: queryClientWrapper(),
    })

    expect(noProject.current.fetchStatus).toBe('idle')
    expect(switchedOff.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('project manager role mutations', () => {
  const managerQueries = [
    { queryKey: ['project', 4, 'managers'] },
    { queryKey: ['project', 4, 'teamManagers'] },
  ]

  it.each([
    ['useSetUserProjectRole', 'PUT', '/api/v2/user/7/project/4/1'],
    ['useRemoveUserFromProject', 'DELETE', '/api/v2/user/7/project/4/1'],
  ] as const)('%s sends %s and refreshes both manager lists', async (hook, method, pathname) => {
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => project[hook](), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ userId: 7, projectId: 4, role: 1 })

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe(method)
    expect(new URL(request.url).pathname).toBe(pathname)
    for (const query of managerQueries) expect(invalidateSpy).toHaveBeenCalledWith(query)
  })

  it('useSetTeamProjectRole grants the team a role and refreshes both manager lists', async () => {
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => project.useSetTeamProjectRole(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ teamId: 2, projectId: 4, role: 1 })

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('POST')
    expect(new URL(request.url).pathname).toBe('/api/v2/team/2/project/4/1')
    for (const query of managerQueries) expect(invalidateSpy).toHaveBeenCalledWith(query)
  })

  it('useRemoveTeamFromProject drops the team and refreshes both manager lists', async () => {
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const { result } = renderHook(() => project.useRemoveTeamFromProject(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ teamId: 2, projectId: 4 })

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(new URL(request.url).pathname).toBe('/api/v2/team/2/project/4')
    for (const query of managerQueries) expect(invalidateSpy).toHaveBeenCalledWith(query)
  })
})
