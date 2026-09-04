import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useNotificationThreads } from '@/hooks/useNotificationThreads'
import { useIntl } from '@/i18n'
import type { Notification } from '@/types/Notification'
import { getNotificationThreadKey } from '@/types/Notification'
import { useAuthContext } from './AuthContext'
import { useWebSocketContext } from './WebSocketContext'

interface NotificationsContextType {
  isLoading: boolean
  notifications: Notification[]
  refetch: () => Promise<unknown>
  markAsRead: (notificationId: number, thread?: Notification[]) => void
  markAsUnread: (notificationId: number, thread?: Notification[]) => void
  deleteNotification: (notificationId: number, thread?: Notification[]) => void
  markAllAsRead: (notificationIds: number[]) => void
  markAllAsUnread: (notificationIds: number[]) => void
  markingReadId: number | null
  markingUnreadId: number | null
  deletingId: number | null
  // Thread dialog
  openNotificationThread: Notification[] | null
  openThread: (notification: Notification) => void
  closeThread: () => void
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export const NotificationsProvider = ({ children }: { children: ReactNode }) => {
  const { t } = useIntl()
  const { lastMessage } = useWebSocketContext()
  const { user } = useAuthContext()
  const { data: notifications = [], isLoading, refetch } = api.user.notification(user?.id)

  const [markingReadId, setMarkingReadId] = useState<number | null>(null)
  const [markingUnreadId, setMarkingUnreadId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [openThreadKey, setOpenThreadKey] = useState<number | string | null>(null)

  const markAsReadMutation = api.user.useMarkNotificationsAsRead()
  const markAsUnreadMutation = api.user.useMarkNotificationsAsUnread()
  const deleteNotificationMutation = api.user.useDeleteNotifications()

  const threads = useNotificationThreads(notifications)

  useEffect(() => {
    if (lastMessage?.messageType === 'notification-new') {
      refetch()
    }
  }, [lastMessage, refetch])

  // All useCallback hooks below are stored in the context value — stable references
  // prevent all context consumers from re-rendering on every provider render.
  const executeMutation = useCallback(
    (
      mutation: {
        mutate: (
          params: { userId: number; notificationIds: number[] },
          options: { onSuccess: () => void; onError: (error: Error) => void }
        ) => void
      },
      notificationIds: number[],
      action: string,
      setLoadingId?: (id: number | null) => void,
      loadingId?: number | null
    ) => {
      if (!user?.id || notificationIds.length === 0) return
      setLoadingId?.(loadingId ?? null)
      mutation.mutate(
        { userId: user.id, notificationIds },
        {
          onSuccess: () => {
            refetch()
            const count = notificationIds.length
            toast.success(
              t(
                'notifications.toast.actionSuccess',
                { count, action },
                '{count, plural, one {# notification {action}} other {# notifications {action}}}'
              )
            )
            setLoadingId?.(null)
          },
          onError: (error: Error) => {
            toast.error(
              t(
                'notifications.toast.actionError',
                { verb: action.replace(/ed$/, '').replace(/d$/, ''), message: error.message },
                'Failed to {verb} notification: {message}'
              )
            )
            setLoadingId?.(null)
          },
        }
      )
    },
    [user?.id, refetch, t]
  )

  const markAsRead = useCallback(
    (notificationId: number, thread?: Notification[]) => {
      const ids = thread && thread.length > 1 ? thread.map((n) => n.id) : [notificationId]
      executeMutation(
        markAsReadMutation,
        ids,
        t('notifications.actions.markedAsRead', undefined, 'marked as read'),
        setMarkingReadId,
        notificationId
      )
    },
    [executeMutation, markAsReadMutation, t]
  )

  const markAsUnread = useCallback(
    (notificationId: number, thread?: Notification[]) => {
      const ids = thread && thread.length > 1 ? thread.map((n) => n.id) : [notificationId]
      executeMutation(
        markAsUnreadMutation,
        ids,
        t('notifications.actions.markedAsUnread', undefined, 'marked as unread'),
        setMarkingUnreadId,
        notificationId
      )
    },
    [executeMutation, markAsUnreadMutation, t]
  )

  const deleteNotification = useCallback(
    (notificationId: number, thread?: Notification[]) => {
      const ids = thread && thread.length > 1 ? thread.map((n) => n.id) : [notificationId]
      executeMutation(
        deleteNotificationMutation,
        ids,
        t('common.deleted2', undefined, 'deleted'),
        setDeletingId,
        notificationId
      )
    },
    [executeMutation, deleteNotificationMutation, t]
  )

  const markAllAsRead = useCallback(
    (notificationIds: number[]) => {
      executeMutation(
        markAsReadMutation,
        notificationIds,
        t('notifications.actions.markedAsRead', undefined, 'marked as read')
      )
    },
    [executeMutation, markAsReadMutation, t]
  )

  const markAllAsUnread = useCallback(
    (notificationIds: number[]) => {
      executeMutation(
        markAsUnreadMutation,
        notificationIds,
        t('notifications.actions.markedAsUnread', undefined, 'marked as unread')
      )
    },
    [executeMutation, markAsUnreadMutation, t]
  )

  // Reason: derived state stored in context value — must be stable to avoid consumer re-renders
  const openNotificationThread = useMemo(() => {
    if (!openThreadKey) return null

    if (typeof openThreadKey === 'string' && openThreadKey.startsWith('single-')) {
      const id = Number.parseInt(openThreadKey.replace('single-', ''), 10)
      const notification = notifications.find((n) => n.id === id)
      return notification ? [notification] : null
    }

    return threads[openThreadKey] || null
  }, [openThreadKey, threads, notifications])

  const openThread = useCallback(
    (notification: Notification) => {
      const key = getNotificationThreadKey(notification)
      const fullThread = threads[key]
      setOpenThreadKey(fullThread && fullThread.length > 0 ? key : `single-${notification.id}`)
    },
    [threads]
  )

  const closeThread = useCallback(() => setOpenThreadKey(null), [])

  // Reason: context value must be stable to prevent all consumers from re-rendering
  const value = useMemo<NotificationsContextType>(
    () => ({
      isLoading,
      notifications,
      refetch,
      markAsRead,
      markAsUnread,
      deleteNotification,
      markAllAsRead,
      markAllAsUnread,
      markingReadId,
      markingUnreadId,
      deletingId,
      openNotificationThread,
      openThread,
      closeThread,
    }),
    [
      isLoading,
      notifications,
      refetch,
      markAsRead,
      markAsUnread,
      deleteNotification,
      markAllAsRead,
      markAllAsUnread,
      markingReadId,
      markingUnreadId,
      deletingId,
      openNotificationThread,
      openThread,
      closeThread,
    ]
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export const useNotificationsContext = () => {
  const context = useContext(NotificationsContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
