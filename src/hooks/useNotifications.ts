import { useQuery } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  notificationsOptions,
  useDeleteNotifications,
  useMarkNotificationsAsRead,
  useMarkNotificationsAsUnread,
} from '@/api/user'
import { useIntl } from '@/i18n'

export const useNotifications = (userId: number) => {
  const { t } = useIntl()
  const { data: notifications = [], isLoading } = useQuery(notificationsOptions(userId))
  const markRead = useMarkNotificationsAsRead()
  const markUnread = useMarkNotificationsAsUnread()
  const remove = useDeleteNotifications()

  const action =
    (mutation: typeof markRead, failure: (error: Error) => string) => (ids: number[]) => {
      if (ids.length === 0) return
      mutation.mutate(
        { userId, notificationIds: ids },
        { onError: (error) => toast.error(failure(error)) }
      )
    }

  return {
    notifications,
    isLoading,
    markAsRead: action(markRead, (error) =>
      t(
        {
          id: 'notifications.toast.markReadFailed',
          defaultMessage: "Couldn't mark notifications as read: {message}",
        },
        { message: error.message }
      )
    ),
    markAsUnread: action(markUnread, (error) =>
      t(
        {
          id: 'notifications.toast.markUnreadFailed',
          defaultMessage: "Couldn't mark notifications as unread: {message}",
        },
        { message: error.message }
      )
    ),
    deleteNotifications: action(remove, (error) =>
      t(
        {
          id: 'notifications.toast.deleteFailed',
          defaultMessage: "Couldn't delete notifications: {message}",
        },
        { message: error.message }
      )
    ),
  }
}
