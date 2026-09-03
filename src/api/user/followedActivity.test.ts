// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { type FollowedAction, userFollowedActivity } from './followedActivity'

afterEach(() => {
  vi.unstubAllGlobals()
})

const action = { id: 1, created: '2026-01-01', typeId: 2 } as FollowedAction

const graphqlResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('userFollowedActivity.followedActivity', () => {
  it('asks for the recent actions of the given mappers', async () => {
    const fetchMock = stubFetch(graphqlResponse({ data: { recentActions: [action] } }))

    const { result } = renderHook(() => userFollowedActivity.followedActivity([3, 1]), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([action])

    const [request] = fetchMock.mock.calls[0]
    expect(new URL(request.url).pathname).toBe('/graphql')
    const body = (await request.clone().json()) as { variables: Record<string, unknown> }
    expect(body.variables).toEqual({ osmIds: [3, 1], limit: 50, offset: 0 })
  })

  it('honours a caller-supplied limit', async () => {
    const fetchMock = stubFetch(graphqlResponse({ data: { recentActions: [] } }))

    const { result } = renderHook(() => userFollowedActivity.followedActivity([1], { limit: 5 }), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    const body = (await fetchMock.mock.calls[0][0].clone().json()) as {
      variables: { limit: number }
    }
    expect(body.variables.limit).toBe(5)
  })

  it('reports no activity when the query comes back empty', async () => {
    stubFetch(graphqlResponse({ data: {} }))

    const { result } = renderHook(() => userFollowedActivity.followedActivity([1]), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([])
  })

  it('does not query when the user follows nobody', () => {
    const fetchMock = stubFetch(graphqlResponse({ data: { recentActions: [] } }))

    const { result } = renderHook(() => userFollowedActivity.followedActivity([]), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not query while the caller has it switched off', () => {
    const fetchMock = stubFetch(graphqlResponse({ data: { recentActions: [] } }))

    const { result } = renderHook(
      () => userFollowedActivity.followedActivity([1], { enabled: false }),
      { wrapper: queryClientWrapper() }
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
