import { toast } from 'sonner'
import { api } from '@/api'
import { useIntl } from '@/i18n'

export const useNotifications = (userId: number) => {
  const { t } = useIntl()
  const { data: notifications = [], isLoading } = api.user.notification(userId)
  const markRead = api.user.useMarkNotificationsAsRead()
  const markUnread = api.user.useMarkNotificationsAsUnread()
  const remove = api.user.useDeleteNotifications()

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
