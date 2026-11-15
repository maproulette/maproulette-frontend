import { Link } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import { useState } from 'react'
import { NotificationItem } from '@/components/Pages/NotificationsPage/NotificationItem'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useNotifications } from '@/hooks/useNotifications'
import { useIntl } from '@/i18n'
import type { Notification } from '@/types/Notification'
import type { User } from '@/types/User'

export const DropdownMenuNotifications = ({ user }: { user: User }) => {
  const { t } = useIntl()
  const [open, setOpen] = useState(false)
  const { notifications, isLoading, markAsRead, markAsUnread } = useNotifications(user.id)
  const unread = notifications.filter((n) => !n.isRead)

  const list = (items: Notification[], empty: string) =>
    items.length === 0 ? (
      <p className="py-8 text-center text-sm text-zinc-500 dark:text-slate-400">{empty}</p>
    ) : (
      <ul className="divide-y divide-zinc-200 dark:divide-slate-800">
        {items.map((n) => (
          <li key={n.id}>
            <NotificationItem
              notification={n}
              onMarkRead={() => markAsRead([n.id])}
              onMarkUnread={() => markAsUnread([n.id])}
              onNavigate={() => setOpen(false)}
            />
          </li>
        ))}
      </ul>
    )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t(
          {
            id: 'appLayout.header.notifications.triggerLabel',
            defaultMessage: 'Notifications for {name}',
          },
          { name: user.osmProfile.displayName }
        )}
        className="relative flex"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unread.length > 0 && (
          <span
            aria-live="polite"
            className="-right-0.75 -top-0.75 absolute size-1.25 rounded-full bg-red-400"
          >
            <span className="sr-only">
              {t({
                id: 'appLayout.header.notifications.unreadSrOnly',
                defaultMessage: 'You have unread notifications',
              })}
            </span>
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={10}
        aria-label={t({ id: 'common.notifications', defaultMessage: 'Notifications' })}
        className="flex w-96 max-w-[calc(100vw-2rem)] flex-col"
      >
        <Tabs defaultValue="unread" className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="flex items-center justify-between gap-2 border-zinc-200 border-b p-3 dark:border-slate-800">
            <TabsList>
              <TabsTrigger value="unread">
                {t(
                  { id: 'common.unread', defaultMessage: 'Unread ({count})' },
                  { count: unread.length }
                )}
              </TabsTrigger>
              <TabsTrigger value="all">
                {t(
                  { id: 'common.all', defaultMessage: 'All ({count})' },
                  { count: notifications.length }
                )}
              </TabsTrigger>
            </TabsList>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAsRead(unread.map((n) => n.id))}
              disabled={unread.length === 0}
            >
              {t({ id: 'common.markAllAsRead', defaultMessage: 'Mark all as read' })}
            </Button>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <TabsContent value="unread" className="mt-0 max-h-[60vh] overflow-y-auto">
                {list(
                  unread,
                  t({
                    id: 'notifications.empty.unread',
                    defaultMessage: 'No unread notifications',
                  })
                )}
              </TabsContent>
              <TabsContent value="all" className="mt-0 max-h-[60vh] overflow-y-auto">
                {list(
                  notifications,
                  t({ id: 'notifications.empty.all', defaultMessage: 'No notifications yet' })
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
        <div className="border-zinc-200 border-t p-3 dark:border-slate-800">
          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="link block text-center font-medium text-sm"
          >
            {t({ id: 'common.viewAllNotifications', defaultMessage: 'View all notifications' })}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  )
}
