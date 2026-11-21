// @vitest-environment happy-dom
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import {
  exportProjectTasksCsv,
  managedProjectsInfiniteOptions,
  projectTeamManagersOptions,
  useCreateProject,
  useDeleteProject,
  useRemoveTeamFromProject,
  useRemoveUserFromProject,
  useSetTeamProjectRole,
  useSetUserProjectRole,
  useUpdateProject,
} from './project'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

const projectA = { id: 1, name: 'Project A', enabled: true }
const projectB = { id: 2, name: 'Project B', enabled: true }

describe('exportProjectTasksCsv', () => {
  it('downloads the CSV using a default filename derived from the project id', async () => {
    stubFetch(new Response('id,name\n1,Task', { status: 200 }))
    const anchor = document.createElement('a')
    const clickSpy = vi.spyOn(anchor, 'click').mockImplementation(() => {})
    vi.spyOn(document, 'createElement').mockReturnValue(anchor)
    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url')
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})

    await exportProjectTasksCsv(42)

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

    await exportProjectTasksCsv(42, 'custom-name.csv')

    expect(anchor.download).toBe('custom-name.csv')

    vi.restoreAllMocks()
  })
})

describe('useCreateProject', () => {
  it('seeds the new project by id and prepends it to a cached managed list', async () => {
    const created = { id: 9, name: 'Created', enabled: true }
    stubFetch(new Response(JSON.stringify(created), { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['project', 'managed', 'seed'], [projectA])

    const { result } = renderHook(() => useCreateProject(), {
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

    const { result } = renderHook(() => useCreateProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ name: 'Created' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['project', 'managed', 'seed'])).toEqual([created])
  })
})

describe('managedProjectsInfiniteOptions', () => {
  it('sends the filters and asks for the next page by page number', async () => {
    const fetchMock = vi.fn(async (request: Request) => {
      if (request.url.includes('page=0')) {
        return new Response(JSON.stringify([projectA, projectB]), { status: 200 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result, rerender } = renderHook(
      () =>
        useInfiniteQuery(
          managedProjectsInfiniteOptions(
            { searchString: 'roads', isArchived: false, projectIds: '1,2' },
            2
          )
        ),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const firstCall = fetchMock.mock.calls[0][0] as Request
    expect(firstCall.url).toContain('api/v2/projects/managed')
    expect(firstCall.url).toContain('limit=2')
    expect(firstCall.url).toContain('searchString=roads')
    expect(firstCall.url).toContain('isArchived=false')
    expect(firstCall.url).toContain('projectIds=1%2C2')
    expect(result.current.hasNextPage).toBe(true)

    await act(async () => {
      await result.current.fetchNextPage()
    })
    rerender()
    expect(result.current.data?.pages.length).toBe(2)
    expect(result.current.hasNextPage).toBe(false)
    const secondCall = fetchMock.mock.calls[1][0] as Request
    expect(secondCall.url).toContain('page=1')
  })
})

describe('useUpdateProject', () => {
  it('patches paged managed lists before the request resolves', async () => {
    let releaseResponse: () => void = () => {}
    const pending = new Promise<void>((resolve) => {
      releaseResponse = resolve
    })
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_request: Request) => {
        await pending
        return new Response(JSON.stringify({ ...projectA, isArchived: true }), { status: 200 })
      })
    )
    const client = createTestQueryClient()
    client.setQueryData(['project', 'managedInfinite', 'seed'], {
      pages: [[projectA], [projectB]],
      pageParams: [0, 1],
    })

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: queryClientWrapper(client),
    })
    act(() => {
      result.current.mutate({ projectId: 1, updates: { isArchived: true } })
    })

    await waitFor(() =>
      expect(client.getQueryData(['project', 'managedInfinite', 'seed'])).toEqual({
        pages: [[{ ...projectA, isArchived: true }], [projectB]],
        pageParams: [0, 1],
      })
    )
    releaseResponse()
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
  })

  it('updates the cached project and replaces the matching entry in managed lists', async () => {
    const updated = { id: 1, name: 'Updated', enabled: true }
    const fetchMock = stubFetch(new Response(JSON.stringify(updated), { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['project', 'managed', 'seed'], [projectA, projectB])

    const { result } = renderHook(() => useUpdateProject(), {
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

    const { result } = renderHook(() => useUpdateProject(), {
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

    const { result } = renderHook(() => useUpdateProject(), {
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

    const { result } = renderHook(() => useUpdateProject(), {
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

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ projectId: 1, updates: { enabled: false } })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(client.getQueryData(['project', 1])).toEqual(projectA)
  })

  it('has nothing to restore when the failed update had nothing cached', async () => {
    stubFetch(new Response('nope', { status: 500 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => useUpdateProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ projectId: 1, updates: { enabled: false } })

    await waitFor(() => expect(result.current.isError).toBe(true))

    expect(client.getQueryData(['project', 1])).toBeUndefined()
  })
})

describe('useDeleteProject', () => {
  it('removes the project query and filters it out of cached managed lists', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 200 }))
    const client = createTestQueryClient()
    client.setQueryData(['project', 5], projectA)
    client.setQueryData(['project', 'managed', 'seed'], [{ id: 5, name: 'Gone' }, projectB])

    const { result } = renderHook(() => useDeleteProject(), {
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

    const { result } = renderHook(() => useDeleteProject(), {
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

    const { result } = renderHook(() => useDeleteProject(), {
      wrapper: queryClientWrapper(client),
    })
    result.current.mutate({ projectId: 1 })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['project', 'managed', 'seed'])).toBeUndefined()
  })
})

describe('projectTeamManagersOptions', () => {
  it('flattens each team grant down to the roles it carries', async () => {
    const team = { id: 2, name: 'Team' }
    const fetchMock = stubFetch(
      new Response(
        JSON.stringify([
          { team, grants: [{ role: 1 }, { role: 2 }] },
          { team, grants: [] },
        ]),
        {
          status: 200,
        }
      )
    )

    const { result } = renderHook(() => useQuery(projectTeamManagersOptions(4)), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([
      { team, roles: [1, 2] },
      { team, roles: [] },
    ])
    expect(new URL(fetchMock.mock.calls[0][0].url).pathname).toBe('/api/v2/teams/projectManagers/4')
  })
})

describe('project manager role mutations', () => {
  const roleHooks = { useSetUserProjectRole, useRemoveUserFromProject }
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

    const { result } = renderHook(() => roleHooks[hook](), {
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

    const { result } = renderHook(() => useSetTeamProjectRole(), {
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

    const { result } = renderHook(() => useRemoveTeamFromProject(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ teamId: 2, projectId: 4 })

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('DELETE')
    expect(new URL(request.url).pathname).toBe('/api/v2/team/2/project/4')
    for (const query of managerQueries) expect(invalidateSpy).toHaveBeenCalledWith(query)
  })
})
