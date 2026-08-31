import { useNavigate, useSearch } from '@tanstack/react-router'
import { useEffect, useId, useRef, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Checkbox } from '@/components/ui/Checkbox'
import { useNotificationsContext } from '@/contexts/NotificationsContext'
import { useNotificationsPageContext } from '@/contexts/NotificationsPageContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { NotificationFilters } from './NotificationFilters'
import { NotificationItem } from './NotificationItem'
import { NotificationSelectAll } from './NotificationSelectAll'
import { NotificationThreadDialog } from './NotificationThreadDialog'
import { NotificationToolbar } from './NotificationToolbar'
import { PageHeader } from './PageHeader'

export const NotificationsPageContent = () => {
  const { t } = useIntl()
  const { notifications, isLoading } = useNotificationsContext()
  const {
    activeTab,
    setActiveTab,
    groupByTask,
    setGroupByTask,
    displayNotifications,
    selectedNotificationIds,
    onSelectChange,
  } = useNotificationsPageContext()

  const navigate = useNavigate()
  const search = useSearch({ from: '/_app/notifications' })
  const notificationId = search.notificationId
  const notificationRefs = useRef<Map<number, HTMLLIElement>>(new Map())
  const [glowingNotificationId, setGlowingNotificationId] = useState<number | null>(null)
  const groupByTaskCheckboxId = useId()

  // Deep-link: switch to correct tab
  useEffect(() => {
    if (notificationId && notifications.length > 0 && !isLoading) {
      const target = notifications.find((n) => n.id === notificationId)
      if (target) {
        setActiveTab(target.isRead ? 'all' : 'unread')
      }
    }
  }, [notificationId, notifications, isLoading, setActiveTab])

  // Deep-link: scroll to notification
  useEffect(() => {
    if (notificationId && !isLoading && notifications.length > 0) {
      const target = notifications.find((n) => n.id === notificationId)
      if (!target) return
      const targetTab = target.isRead ? 'all' : 'unread'
      if (activeTab !== targetTab) return

      const isInDisplayList = displayNotifications.some((n) => {
        if (n.id === notificationId) return true
        return groupByTask && (n.thread?.some((notif) => notif.id === notificationId) ?? false)
      })

      if (isInDisplayList) {
        let glowTimeoutId: ReturnType<typeof setTimeout> | undefined
        const timeoutId = setTimeout(() => {
          const element = notificationRefs.current.get(notificationId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' })
            element.focus()
            setGlowingNotificationId(notificationId)
            glowTimeoutId = setTimeout(() => setGlowingNotificationId(null), 3000)
            navigate({
              to: '/notifications',
              search: (prev) => ({ ...prev, notificationId: undefined }),
              replace: true,
            })
          }
        }, 500)
        return () => {
          clearTimeout(timeoutId)
          clearTimeout(glowTimeoutId)
        }
      }
    }
    return
  }, [
    notificationId,
    activeTab,
    notifications,
    isLoading,
    displayNotifications,
    groupByTask,
    navigate,
  ])

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto max-w-4xl px-4 py-6">
        <PageHeader
          title={t('notificationsPage.content.title', undefined, 'Notifications')}
          description={t(
            'notificationsPage.content.description',
            undefined,
            'View and manage your notifications'
          )}
        />
        <div className="mb-4 flex flex-wrap items-center gap-4">
          <Checkbox
            id={groupByTaskCheckboxId}
            checked={groupByTask}
            onCheckedChange={(checked) => setGroupByTask(checked === true)}
          />
          <label
            htmlFor={groupByTaskCheckboxId}
            className="cursor-pointer text-sm text-zinc-600 dark:text-slate-400"
          >
            {t('notificationsPage.content.groupByTask', undefined, 'Group by Task')}
          </label>
          {groupByTask && (
            <span className="text-xs text-zinc-500 dark:text-slate-500">
              {t(
                'notificationsPage.content.groupByTaskHint',
                undefined,
                'Notifications for the same task are grouped together'
              )}
            </span>
          )}
        </div>
        <NotificationFilters />
        <NotificationToolbar />

        {isLoading ? (
          <Card className="p-6">
            <div className="text-center text-zinc-500 dark:text-slate-500">
              {t('common.loadingNotifications', undefined, 'Loading notifications...')}
            </div>
          </Card>
        ) : displayNotifications.length > 0 ? (
          <div className="space-y-3">
            <NotificationSelectAll />
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-slate-700 dark:bg-slate-800">
              <ul className="divide-y divide-zinc-200 dark:divide-slate-700">
                {displayNotifications.map((notification) => {
                  const thread = notification.thread
                  const isSelected = thread
                    ? thread.some((n) => selectedNotificationIds.has(n.id))
                    : selectedNotificationIds.has(notification.id)
                  const isIndeterminate = thread
                    ? thread.some((n) => selectedNotificationIds.has(n.id)) &&
                      !thread.every((n) => selectedNotificationIds.has(n.id))
                    : false

                  return (
                    <li
                      key={notification.id}
                      ref={(el) => {
                        if (el) {
                          notificationRefs.current.set(notification.id, el)
                        } else {
                          notificationRefs.current.delete(notification.id)
                        }
                      }}
                      tabIndex={-1}
                      className={cn(
                        'transition-all duration-300 focus:outline-none',
                        glowingNotificationId === notification.id &&
                          'animate-pulse bg-blue-100/60 dark:bg-blue-950/40'
                      )}
                    >
                      <NotificationItem
                        notification={notification}
                        showDelete={true}
                        showCheckbox={true}
                        thread={thread}
                        threadCount={notification.threadCount}
                        isSelected={isSelected}
                        isIndeterminate={isIndeterminate}
                        onSelectChange={(checked) =>
                          onSelectChange(notification.id, checked, thread)
                        }
                      />
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        ) : (
          <Card className="p-6">
            <div className="space-y-2 text-center">
              <p className="font-semibold text-base">
                {t('common.youreAllUpToDate', undefined, "You're all up to date")}
              </p>
              <p className="text-sm text-zinc-500 dark:text-slate-500">
                {activeTab === 'unread'
                  ? t(
                      'common.noUnreadNotificationsYet',
                      undefined,
                      'You have no unread notifications at the moment.'
                    )
                  : t('common.noNotificationsYet', undefined, 'You have no notifications.')}
              </p>
            </div>
          </Card>
        )}

        <NotificationThreadDialog />
      </div>
    </div>
  )
}
