// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { NotificationSubscriptions } from '@/lib/notificationSubscriptions'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { stubFetch } from '@/test/stubFetch'
import { useUpdateNotificationSubscriptions } from './subscriptions'

afterEach(() => {
  vi.unstubAllGlobals()
})

const subscriptions = { id: 1, userId: 7, mention: 2 } as unknown as NotificationSubscriptions

describe('useUpdateNotificationSubscriptions', () => {
  it('saves the preferences and seeds the cache with what was saved', async () => {
    const fetchMock = stubFetch(new Response('ok', { status: 200 }))
    const queryClient = createTestQueryClient()

    const { result } = renderHook(() => useUpdateNotificationSubscriptions(), {
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
