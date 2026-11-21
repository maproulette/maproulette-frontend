import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Notification } from '@/types/Notification'
import { apiRequest } from '../client'
import { userKeys } from './keys'

const notificationsKey = (userId: number | undefined) => [...userKeys.notifications, userId]

type NotificationsMutation = { userId: number; notificationIds: number[] }

// Applies the change to the cache right away, then refetches to pick up the server's view
// (which also undoes the change if the request failed).
const useNotificationsMutation = (
  path: string,
  update: (notifications: Notification[], ids: number[]) => Notification[]
) => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, notificationIds }: NotificationsMutation) =>
      apiRequest.put(`api/v2/user/${userId}/${path}`, { json: { notificationIds } }).json(),
    onMutate: async ({ userId, notificationIds }) => {
      await queryClient.cancelQueries({ queryKey: notificationsKey(userId) })
      queryClient.setQueryData<Notification[]>(
        notificationsKey(userId),
        (old) => old && update(old, notificationIds)
      )
    },
    onSettled: (_data, _error, { userId }) =>
      queryClient.invalidateQueries({ queryKey: notificationsKey(userId) }),
  })
}

export const notificationsOptions = (userId: number | undefined) =>
  queryOptions({
    queryKey: notificationsKey(userId),
    queryFn: () =>
      apiRequest
        .get(`api/v2/user/${userId}/notifications`, {
          // Newest first; the backend otherwise puts unread ones first
          searchParams: { limit: -1, sort: 'created', order: 'DESC' },
        })
        .json<Notification[]>(),
    enabled: !!userId,
    // Websocket pushes are off by default, so poll as well.
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true,
  })

export const useMarkNotificationsAsRead = () =>
  useNotificationsMutation('notifications', (notifications, ids) =>
    notifications.map((n) => (ids.includes(n.id) ? { ...n, isRead: true } : n))
  )

export const useMarkNotificationsAsUnread = () =>
  useNotificationsMutation('notifications/unread', (notifications, ids) =>
    notifications.map((n) => (ids.includes(n.id) ? { ...n, isRead: false } : n))
  )

export const useDeleteNotifications = () =>
  useNotificationsMutation('notifications/delete', (notifications, ids) =>
    notifications.filter((n) => !ids.includes(n.id))
  )
