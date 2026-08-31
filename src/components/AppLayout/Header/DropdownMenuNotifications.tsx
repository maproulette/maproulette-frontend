import { Link, useNavigate } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import { NotificationItem } from '@/components/Pages/NotificationsPage/NotificationItem'
import { NotificationThreadDialog } from '@/components/Pages/NotificationsPage/NotificationThreadDialog'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useNotificationsContext } from '@/contexts/NotificationsContext'
import { useIntl } from '@/i18n'
import type { User } from '@/types/User'

export const DropdownMenuNotifications = ({ user }: { user: User }) => {
  const { notifications, isLoading, markAllAsRead, closeThread } = useNotificationsContext()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const { t } = useIntl()

  const unreadNotifications = notifications.filter((n) => !n.isRead)
  const unreadCount = unreadNotifications.length

  const handleMarkAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsRead(unreadNotifications.map((n) => n.id))
    }
  }

  const handleViewAllNotifications = () => {
    closeThread()
    setOpen(false)
    navigate({ to: '/notifications' })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t(
          'appLayout.header.notifications.triggerLabel',
          { name: user.osmProfile.displayName },
          'Notifications for {name}'
        )}
        className="relative flex"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            aria-live="polite"
            className="-right-0.75 -top-0.75 absolute size-1.25 rounded-full bg-red-400 motion-safe:animate-pulse"
          >
            <span className="sr-only">
              {t(
                'appLayout.header.notifications.unreadSrOnly',
                undefined,
                'You have unread notifications'
              )}
            </span>
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        className="flex w-96 max-w-[calc(100vw-2rem)] flex-col p-4"
      >
        <Tabs defaultValue="unread" className="flex min-h-0 flex-1 flex-col">
          <div className="mb-4 flex items-center justify-between gap-2">
            <TabsList>
              <TabsTrigger value="unread">
                {t('common.unread', { count: unreadCount }, 'Unread ({count})')}
              </TabsTrigger>
              <TabsTrigger value="all">
                {t('common.all', { count: notifications.length }, 'All ({count})')}
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              {t('common.markAllAsRead', undefined, 'Mark all as read')}
            </Button>
          </div>

          {isLoading ? (
            <Card className="p-6">
              <div className="text-center text-sm text-zinc-500 dark:text-slate-500">
                {t('common.loadingNotifications', undefined, 'Loading notifications...')}
              </div>
            </Card>
          ) : (
            <>
              <TabsContent
                value="unread"
                className="-mx-1 mt-0 max-h-[60vh] min-h-0 flex-1 overflow-y-auto px-1"
              >
                <NotificationList
                  notifications={unreadNotifications}
                  emptyTitle={t('common.youreAllUpToDate', undefined, "You're all up to date")}
                  emptyDescription={t(
                    'common.noUnreadNotificationsYet',
                    undefined,
                    'You have no unread notifications at the moment.'
                  )}
                  onLinkClick={() => setOpen(false)}
                />
              </TabsContent>
              <TabsContent
                value="all"
                className="-mx-1 mt-0 max-h-[60vh] min-h-0 flex-1 overflow-y-auto px-1"
              >
                <NotificationList
                  notifications={notifications}
                  emptyTitle={t('common.youreAllUpToDate', undefined, "You're all up to date")}
                  emptyDescription={t(
                    'common.noNotificationsYet',
                    undefined,
                    'You have no notifications.'
                  )}
                  onLinkClick={() => setOpen(false)}
                />
              </TabsContent>
            </>
          )}
        </Tabs>

        <div className="mt-4 border-zinc-200 border-t pt-3 dark:border-slate-800">
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="link block text-center font-medium text-sm"
          >
            {t('common.viewAllNotifications', undefined, 'View all notifications')}
          </Link>
        </div>
      </PopoverContent>

      <NotificationThreadDialog onViewAll={handleViewAllNotifications} />
    </Popover>
  )
}

const NotificationList = ({
  notifications,
  emptyTitle,
  emptyDescription,
  onLinkClick,
}: {
  notifications: ReturnType<typeof useNotificationsContext>['notifications']
  emptyTitle: string
  emptyDescription: string
  onLinkClick?: () => void
}) => {
  if (notifications.length === 0) {
    return (
      <Card className="p-6">
        <div className="space-y-2 text-center">
          <p className="font-semibold text-sm">{emptyTitle}</p>
          <p className="text-xs text-zinc-500 dark:text-slate-500">{emptyDescription}</p>
        </div>
      </Card>
    )
  }

  return (
    <div className="rounded-xl bg-zinc-100 p-3 dark:bg-slate-950">
      <ul className="space-y-2">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:shadow-none dark:hover:brightness-110"
          >
            <NotificationItem
              notification={notification}
              alwaysShowActions={false}
              onLinkClick={onLinkClick}
            />
          </li>
        ))}
      </ul>
    </div>
  )
}
