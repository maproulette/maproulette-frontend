// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NotificationSubscriptions } from '@/lib/notificationSubscriptions'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { waitFor } from '@/test/waitFor'
import { userSubscriptions } from './subscriptions'

afterEach(() => {
  vi.unstubAllGlobals()
})

const subscriptions = { id: 1, userId: 7, mention: 2 } as unknown as NotificationSubscriptions

const jsonResponse = (body: unknown) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })

describe('userSubscriptions.notificationSubscriptions', () => {
  it('fetches the user’s delivery preferences', async () => {
    const fetchMock = stubFetch(jsonResponse(subscriptions))

    const { result } = renderHook(() => userSubscriptions.notificationSubscriptions(7), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(subscriptions)
    expect(new URL(fetchMock.mock.calls[0][0].url).pathname).toBe(
      '/api/v2/user/7/notificationSubscriptions'
    )
  })

  it('does not fetch until there is a user to fetch for', async () => {
    const fetchMock = stubFetch(jsonResponse(subscriptions))

    const { result } = renderHook(() => userSubscriptions.notificationSubscriptions(0), {
      wrapper: queryClientWrapper(),
    })

    expect(result.current.fetchStatus).toBe('idle')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('userSubscriptions.useUpdateNotificationSubscriptions', () => {
  it('saves the preferences and seeds the cache with what was saved', async () => {
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => userSubscriptions.useUpdateNotificationSubscriptions(), {
      wrapper: queryClientWrapper(queryClient),
    })
    await result.current.mutateAsync({ userId: 7, subscriptions })

    const [request] = fetchMock.mock.calls[0]
    expect(request.method).toBe('PUT')
    expect(new URL(request.url).pathname).toBe('/api/v2/user/7/notificationSubscriptions')
    expect(await request.clone().json()).toEqual(subscriptions)
    expect(queryClient.getQueryData(['user', 7, 'notificationSubscriptions'])).toEqual(
      subscriptions
    )
  })
})
