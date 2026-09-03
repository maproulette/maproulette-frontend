// @vitest-environment happy-dom
import { useQuery } from '@tanstack/react-query'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { challengeExplore } from './explore'

afterEach(() => {
  vi.unstubAllGlobals()
})

const challengeA = { id: 1, name: 'Challenge A' }
const challengeB = { id: 2, name: 'Challenge B' }

describe('challengeExplore.preferredChallenges', () => {
  it('fetches preferred challenges with the given params', async () => {
    const response = { popular: [challengeA], featured: [], newest: [] }
    const fetchMock = stubFetch(new Response(JSON.stringify(response), { status: 200 }))

    const { result } = renderHook(() => challengeExplore.preferredChallenges({ limit: 5 }), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(response)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('api/v2/challenges/preferred')
    expect(request.url).toContain('limit=5')
  })
})

describe('challengeExplore.featuredChallenges', () => {
  it('fetches featured challenges and seeds the per-challenge cache', async () => {
    stubFetch(new Response(JSON.stringify([challengeA, challengeB]), { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => challengeExplore.featuredChallenges({ limit: 10 }), {
      wrapper: queryClientWrapper(client),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([challengeA, challengeB])
    expect(client.getQueryData(['challenge', 1])).toEqual(challengeA)
    expect(client.getQueryData(['challenge', 2])).toEqual(challengeB)
  })
})

describe('challengeExplore.exploreChallenges', () => {
  it('fetches challenges with converted search params and seeds the per-challenge cache', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([challengeA]), { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(
      () => challengeExplore.exploreChallenges({ global: true, limit: 10 }),
      { wrapper: queryClientWrapper(client) }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([challengeA])
    expect(client.getQueryData(['challenge', 1])).toEqual(challengeA)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('global=true')
    expect(request.url).toContain('limit=10')
  })

  it('collapses an embedded parent project to its id when seeding the per-challenge cache', async () => {
    // exploreChallenges runs the backend's insertProjectJSON, which replaces the
    // scalar `parent` with the full project object. The single-challenge cache
    // must keep the id, or consumers request `api/v2/project/[object Object]`.
    const embedded = { id: 3, name: 'Challenge C', parent: { id: 42, name: 'My Project' } }
    stubFetch(new Response(JSON.stringify([embedded]), { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => challengeExplore.exploreChallenges({ limit: 10 }), {
      wrapper: queryClientWrapper(client),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(client.getQueryData(['challenge', 3])).toEqual({
      id: 3,
      name: 'Challenge C',
      parent: 42,
    })
    // The list itself keeps the embedded project, which list views read for the name.
    expect(result.current.data).toEqual([embedded])
  })

  it('fetches with no search params when params is undefined', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => challengeExplore.exploreChallenges(undefined), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toBe(
      `${window.env.VITE_API_BASE_URL || 'http://127.0.0.1:9000'}/api/v2/challenges/exploreChallenges`
    )
  })
})

describe('challengeExplore.exploreChallengesInfinite', () => {
  it('fetches the first page, seeds the cache, and reports a next page when the page is full', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify([challengeA, challengeB]), { status: 200 })
    )
    const client = createTestQueryClient()

    const { result } = renderHook(() => challengeExplore.exploreChallengesInfinite({ limit: 2 }), {
      wrapper: queryClientWrapper(client),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages).toEqual([[challengeA, challengeB]])
    expect(client.getQueryData(['challenge', 1])).toEqual(challengeA)
    expect(result.current.hasNextPage).toBe(true)

    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('limit=2')
    expect(request.url).toContain('offset=0')
  })

  it('reports no next page when the returned page is shorter than the limit', async () => {
    stubFetch(new Response(JSON.stringify([challengeA]), { status: 200 }))

    const { result } = renderHook(() => challengeExplore.exploreChallengesInfinite({ limit: 10 }), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(false)
  })

  it('defaults the page-size limit to 10 when params has no limit', async () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `C${i + 1}` }))
    stubFetch(new Response(JSON.stringify(ten), { status: 200 }))

    const { result } = renderHook(() => challengeExplore.exploreChallengesInfinite(undefined), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(true)
  })

  it('posts the place boundary in the body and keeps the filters in the query string', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([challengeA]), { status: 200 }))

    const { result } = renderHook(
      () =>
        challengeExplore.exploreChallengesInfinite({
          limit: 10,
          bounds: '-98,37,-97,38',
          placeGeometryJson: '{"type":"Polygon","coordinates":[]}',
          placeKey: 'R129814:boundary',
        }),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('POST')
    expect(request.url).toContain('bounds=-98%2C37%2C-97%2C38')
    expect(request.url).not.toContain('placeGeometryJson')
    expect(request.url).not.toContain('placeKey')
    expect(await request.clone().text()).toBe('{"polygon":{"type":"Polygon","coordinates":[]}}')
  })

  it('does not fetch at all when the query is disabled', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([challengeA]), { status: 200 }))

    renderHook(
      () => challengeExplore.exploreChallengesInfinite({ limit: 10 }, { enabled: false }),
      {
        wrapper: queryClientWrapper(),
      }
    )

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to a plain GET when the server has no POST route for boundaries', async () => {
    vi.resetModules()
    // Fresh module: the fallback is remembered for the rest of the session.
    const { challengeExplore: freshExplore } = await import('./explore')

    const fetchMock = vi.fn(async (request: Request) =>
      request.method === 'POST'
        ? new Response('Action Not Found', { status: 404 })
        : new Response(JSON.stringify([challengeA]), { status: 200 })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(
      () =>
        freshExplore.exploreChallengesInfinite({
          limit: 10,
          placeGeometryJson: '{"type":"Polygon","coordinates":[]}',
          placeKey: 'R1:boundary',
        }),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages).toEqual([[challengeA]])
    expect(fetchMock.mock.calls.map(([request]) => request.method)).toEqual(['POST', 'GET'])
  })

  it('surfaces a rejected geometry instead of quietly dropping the boundary', async () => {
    vi.resetModules()
    const { challengeExplore: freshExplore } = await import('./explore')

    const fetchMock = vi.fn(
      async (_request: Request) =>
        new Response(JSON.stringify({ status: 'KO', message: 'polygon must be a GeoJSON...' }), {
          status: 400,
        })
    )
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(
      () =>
        freshExplore.exploreChallengesInfinite({
          limit: 10,
          placeGeometryJson: '{"type":"LineString","coordinates":[]}',
          placeKey: 'R1:boundary',
        }),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(fetchMock.mock.calls.map(([request]) => request.method)).toEqual(['POST'])
  })

  it('surfaces a network failure on the boundary POST rather than retrying without it', async () => {
    vi.resetModules()
    const { challengeExplore: freshExplore } = await import('./explore')

    const fetchMock = vi.fn(() => Promise.reject(new Error('offline')))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(
      () =>
        freshExplore.exploreChallengesInfinite({
          limit: 10,
          placeGeometryJson: '{"type":"Polygon","coordinates":[]}',
          placeKey: 'R1:boundary',
        }),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('surfaces a server error on the boundary POST rather than retrying without it', async () => {
    vi.resetModules()
    const { challengeExplore: freshExplore } = await import('./explore')

    const fetchMock = vi.fn(async (_request: Request) => new Response('boom', { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    const { result } = renderHook(
      () =>
        freshExplore.exploreChallengesInfinite({
          limit: 10,
          placeGeometryJson: '{"type":"Polygon","coordinates":[]}',
          placeKey: 'R1:boundary',
        }),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(fetchMock.mock.calls.map(([request]) => request.method)).toEqual(['POST'])
  })

  it('fetches subsequent pages using the accumulated offset', async () => {
    const fetchMock = vi.fn(async (request: Request) => {
      if (request.url.includes('offset=0')) {
        return new Response(JSON.stringify([challengeA, challengeB]), { status: 200 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result, rerender } = renderHook(
      () => challengeExplore.exploreChallengesInfinite({ limit: 2 }),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    await act(async () => {
      await result.current.fetchNextPage()
    })
    rerender()
    expect(result.current.data?.pages.length).toBe(2)

    const secondCall = fetchMock.mock.calls[1][0] as Request
    expect(secondCall.url).toContain('offset=2')
  })
})

describe('challengeExplore.getChallengesListingOptions', () => {
  it('builds the expected query key with default limit/onlyEnabled', () => {
    const options = challengeExplore.getChallengesListingOptions([1, 2])

    expect(options.queryKey).toEqual([
      'challenge',
      'listing',
      [1, 2],
      { limit: -1, page: 0, onlyEnabled: false },
    ])
  })

  it('builds the expected query key with explicit limit, page, and onlyEnabled', () => {
    const options = challengeExplore.getChallengesListingOptions([3], {
      limit: 20,
      page: 1,
      onlyEnabled: true,
    })

    expect(options.queryKey).toEqual([
      'challenge',
      'listing',
      [3],
      { limit: 20, page: 1, onlyEnabled: true },
    ])
  })

  it('fetches listing data with default limit/onlyEnabled when used as query options', async () => {
    const listing = [{ id: 1, name: 'Challenge A' }]
    const fetchMock = stubFetch(new Response(JSON.stringify(listing), { status: 200 }))

    const { result } = renderHook(
      () => useQuery(challengeExplore.getChallengesListingOptions([1, 2])),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(listing)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('projectIds=1%2C2')
    expect(request.url).toContain('limit=-1')
    expect(request.url).toContain('onlyEnabled=false')
  })
})

describe('challengeExplore.listing', () => {
  it('fetches a challenge listing with default limit/page/onlyEnabled and seeds the cache', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify([challengeA, challengeB]), { status: 200 })
    )
    const client = createTestQueryClient()

    const { result } = renderHook(() => challengeExplore.listing([1, 2]), {
      wrapper: queryClientWrapper(client),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([challengeA, challengeB])
    expect(client.getQueryData(['challenge', 1])).toEqual(challengeA)
    expect(client.getQueryData(['challenge', 2])).toEqual(challengeB)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('limit=100')
    expect(request.url).toContain('page=0')
    expect(request.url).toContain('onlyEnabled=false')
  })

  it('honors explicit limit, page, and onlyEnabled values', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    const { result } = renderHook(() => challengeExplore.listing([1], 5, 2, true), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('limit=5')
    expect(request.url).toContain('page=2')
    expect(request.url).toContain('onlyEnabled=true')
  })
})

describe('challengeExplore.searchChallenges', () => {
  it('is disabled when no search term is provided', () => {
    const fetchMock = stubFetch(new Response('[]', { status: 200 }))

    const { result } = renderHook(() => challengeExplore.searchChallenges(), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('fetches matching challenges and seeds the per-challenge cache when a search term is given', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([challengeA]), { status: 200 }))
    const client = createTestQueryClient()

    const { result } = renderHook(() => challengeExplore.searchChallenges({ search: 'road' }), {
      wrapper: queryClientWrapper(client),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([challengeA])
    expect(client.getQueryData(['challenge', 1])).toEqual(challengeA)
    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('search=road')
  })
})

describe('challengeExplore.fetchChallengesByDifficulty', () => {
  it('asks for the most popular global challenges at that difficulty', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([challengeA]), { status: 200 }))

    await expect(challengeExplore.fetchChallengesByDifficulty(2)).resolves.toEqual([challengeA])

    const url = new URL(fetchMock.mock.calls[0][0].url)
    expect(url.pathname).toBe('/api/v2/challenges/exploreChallenges')
    expect(url.searchParams.get('difficulty')).toBe('2')
    expect(url.searchParams.get('sortBy')).toBe('popularity')
    expect(url.searchParams.get('global')).toBe('true')
    expect(url.searchParams.get('limit')).toBe('50')
  })

  it('honours a caller-supplied limit', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([]), { status: 200 }))

    await challengeExplore.fetchChallengesByDifficulty(1, 5)

    expect(new URL(fetchMock.mock.calls[0][0].url).searchParams.get('limit')).toBe('5')
  })
})
