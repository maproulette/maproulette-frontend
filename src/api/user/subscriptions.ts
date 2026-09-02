import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { NotificationSubscriptions } from '@/lib/notificationSubscriptions'
import { apiRequest } from '../client'

export const userSubscriptions = {
  /** The user's per-notification-type delivery preferences. */
  notificationSubscriptions: (userId: number) =>
    useQuery(
      queryOptions({
        queryKey: ['user', userId, 'notificationSubscriptions'],
        queryFn: () =>
          apiRequest
            .get(`api/v2/user/${userId}/notificationSubscriptions`)
            .json<NotificationSubscriptions>(),
        enabled: !!userId,
      })
    ),

  useUpdateNotificationSubscriptions: () => {
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
        queryClient.setQueryData(['user', userId, 'notificationSubscriptions'], subscriptions)
      },
    })
  },
}
