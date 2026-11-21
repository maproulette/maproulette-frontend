// @vitest-environment happy-dom
import { useInfiniteQuery } from '@tanstack/react-query'
import { act } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { challengeListingInfiniteOptions, exploreChallengesInfiniteOptions } from './explore'

afterEach(() => {
  vi.unstubAllGlobals()
})

const challengeA = { id: 1, name: 'Challenge A' }
const challengeB = { id: 2, name: 'Challenge B' }

describe('exploreChallengesInfiniteOptions', () => {
  it('fetches the first page and reports a next page when the page is full', async () => {
    const fetchMock = stubFetch(
      new Response(JSON.stringify([challengeA, challengeB]), { status: 200 })
    )
    const client = createTestQueryClient()

    const { result } = renderHook(
      () => useInfiniteQuery(exploreChallengesInfiniteOptions({ limit: 2 })),
      {
        wrapper: queryClientWrapper(client),
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages).toEqual([[challengeA, challengeB]])
    expect(result.current.hasNextPage).toBe(true)

    const [request] = fetchMock.mock.calls[0]
    expect(request.url).toContain('limit=2')
    expect(request.url).toContain('offset=0')
  })

  it('reports no next page when the returned page is shorter than the limit', async () => {
    stubFetch(new Response(JSON.stringify([challengeA]), { status: 200 }))

    const { result } = renderHook(
      () => useInfiniteQuery(exploreChallengesInfiniteOptions({ limit: 10 })),
      {
        wrapper: queryClientWrapper(),
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(false)
  })

  it('defaults the page-size limit to 10 when params has no limit', async () => {
    const ten = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `C${i + 1}` }))
    stubFetch(new Response(JSON.stringify(ten), { status: 200 }))

    const { result } = renderHook(
      () => useInfiniteQuery(exploreChallengesInfiniteOptions(undefined)),
      {
        wrapper: queryClientWrapper(),
      }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(true)
  })

  it('posts the place boundary in the body and keeps the filters in the query string', async () => {
    const fetchMock = stubFetch(new Response(JSON.stringify([challengeA]), { status: 200 }))

    const { result } = renderHook(
      () =>
        useInfiniteQuery(
          exploreChallengesInfiniteOptions({
            limit: 10,
            bounds: '-98,37,-97,38',
            placeGeometryJson: '{"type":"Polygon","coordinates":[]}',
            placeKey: 'R129814:boundary',
          })
        ),
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

  it('fetches subsequent pages using the accumulated offset', async () => {
    const fetchMock = vi.fn(async (request: Request) => {
      if (request.url.includes('offset=0')) {
        return new Response(JSON.stringify([challengeA, challengeB]), { status: 200 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result, rerender } = renderHook(
      () => useInfiniteQuery(exploreChallengesInfiniteOptions({ limit: 2 })),
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

describe('challengeListingInfiniteOptions', () => {
  it('sends the filters and asks for the next page by row offset', async () => {
    const fetchMock = vi.fn(async (request: Request) => {
      if (request.url.includes('page=0')) {
        return new Response(JSON.stringify([challengeA, challengeB]), { status: 200 })
      }
      return new Response(JSON.stringify([]), { status: 200 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const { result, rerender } = renderHook(
      () =>
        useInfiniteQuery(
          challengeListingInfiniteOptions(
            [1, 2],
            {
              searchString: 'roads',
              onlyEnabled: true,
              onlyArchived: false,
              onlyOwned: true,
              challengeIds: '7,8',
            },
            2
          )
        ),
      { wrapper: queryClientWrapper() }
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const firstCall = fetchMock.mock.calls[0][0] as Request
    expect(firstCall.url).toContain('api/v2/challenges/listing')
    expect(firstCall.url).toContain('projectIds=1%2C2')
    expect(firstCall.url).toContain('limit=2')
    expect(firstCall.url).toContain('searchString=roads')
    expect(firstCall.url).toContain('onlyEnabled=true')
    expect(firstCall.url).toContain('onlyOwned=true')
    expect(firstCall.url).toContain('challengeIds=7%2C8')
    expect(result.current.hasNextPage).toBe(true)

    await act(async () => {
      await result.current.fetchNextPage()
    })
    rerender()
    expect(result.current.data?.pages.length).toBe(2)
    expect(result.current.hasNextPage).toBe(false)
    const secondCall = fetchMock.mock.calls[1][0] as Request
    expect(secondCall.url).toContain('page=2')
  })
})
