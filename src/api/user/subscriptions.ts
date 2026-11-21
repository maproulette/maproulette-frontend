import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import type { NotificationSubscriptions } from '@/lib/notificationSubscriptions'
import { apiRequest } from '../client'
import { userKeys } from './keys'

const subscriptionsKey = (userId: number) =>
  [...userKeys.user(userId), 'notificationSubscriptions'] as const

/** The user's per-notification-type delivery preferences. */
export const notificationSubscriptionsOptions = (userId: number) =>
  queryOptions({
    queryKey: subscriptionsKey(userId),
    queryFn: () =>
      apiRequest
        .get(`api/v2/user/${userId}/notificationSubscriptions`)
        .json<NotificationSubscriptions>(),
    enabled: !!userId,
  })

export const useUpdateNotificationSubscriptions = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      userId,
      subscriptions,
    }: {
      userId: number
      subscriptions: NotificationSubscriptions
    }) =>
      apiRequest
        .put(`api/v2/user/${userId}/notificationSubscriptions`, { json: subscriptions })
        .text(),
    onSuccess: (_data, { userId, subscriptions }) => {
      queryClient.setQueryData(subscriptionsKey(userId), subscriptions)
    },
  })
}
