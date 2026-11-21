// @vitest-environment happy-dom
import { useQuery } from '@tanstack/react-query'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { baseNotification } from '@/test/notificationFixtures'
import { createTestQueryClient, queryClientWrapper } from '@/test/queryClient'
import { renderHook } from '@/test/renderHook'
import { waitFor } from '@/test/waitFor'
import {
  notificationsOptions,
  useDeleteNotifications,
  useMarkNotificationsAsRead,
} from './notifications'

const key = ['user', 'notifications', 7]

const stubFetch = (handler: (request: Request) => Response | Promise<Response>) => {
  const fetchMock = vi.fn(async (request: Request) => handler(request))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const never = () => new Promise<Response>(() => {})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('notificationsOptions', () => {
  it('asks for every notification, not just the first page', async () => {
    const fetchMock = stubFetch(() => new Response('[]'))

    const { result } = renderHook(() => useQuery(notificationsOptions(7)), {
      wrapper: queryClientWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(new URL(fetchMock.mock.calls[0][0].url).searchParams.get('limit')).toBe('-1')
  })
})

describe('notification mutations', () => {
  it('mark notifications read before the server answers', async () => {
    stubFetch(never)
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(key, [baseNotification({ id: 1 }), baseNotification({ id: 2 })])

    const { result } = renderHook(() => useMarkNotificationsAsRead(), {
      wrapper: queryClientWrapper(queryClient),
    })
    result.current.mutate({ userId: 7, notificationIds: [1] })

    await waitFor(() =>
      expect(
        queryClient.getQueryData<{ id: number; isRead: boolean }[]>(key)?.map((n) => n.isRead)
      ).toEqual([true, false])
    )
  })

  it('remove deleted notifications before the server answers', async () => {
    stubFetch(never)
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(key, [baseNotification({ id: 1 }), baseNotification({ id: 2 })])

    const { result } = renderHook(() => useDeleteNotifications(), {
      wrapper: queryClientWrapper(queryClient),
    })
    result.current.mutate({ userId: 7, notificationIds: [1] })

    await waitFor(() =>
      expect(queryClient.getQueryData<{ id: number }[]>(key)?.map((n) => n.id)).toEqual([2])
    )
  })

  it("put back the server's state when a change fails", async () => {
    const stored = [baseNotification({ id: 1, isRead: false })]
    stubFetch((request) =>
      request.method === 'GET'
        ? new Response(JSON.stringify(stored))
        : new Response('nope', { status: 500 })
    )

    const { result } = renderHook(
      () => ({
        list: useQuery(notificationsOptions(7)),
        markRead: useMarkNotificationsAsRead(),
      }),
      { wrapper: queryClientWrapper() }
    )
    await waitFor(() => expect(result.current.list.isSuccess).toBe(true))

    result.current.markRead.mutate({ userId: 7, notificationIds: [1] })

    await waitFor(() => expect(result.current.markRead.isError).toBe(true))
    await waitFor(() => expect(result.current.list.data?.[0].isRead).toBe(false))
  })
})
