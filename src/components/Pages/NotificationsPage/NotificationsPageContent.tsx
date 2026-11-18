import { useNavigate, useSearch } from '@tanstack/react-router'
import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/AlertDialog'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useNotifications } from '@/hooks/useNotifications'
import { useIntl } from '@/i18n'
import { NotificationItem } from './NotificationItem'

export const NotificationsPageContent = ({ userId }: { userId: number }) => {
  const { t } = useIntl()
  const navigate = useNavigate()
  const { tab = 'unread' } = useSearch({ from: '/_app/notifications' })
  const { notifications, isLoading, markAsRead, markAsUnread, deleteNotifications } =
    useNotifications(userId)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const unread = notifications.filter((n) => !n.isRead)
  const shown = tab === 'unread' ? unread : notifications
  // Only what's on screen counts as selected so rows that leave the tab (eg. by being
  // marked read) are dropped from the selection
  const selectedIds = shown.filter((n) => selected.has(n.id)).map((n) => n.id)

  const setTab = (value: string) => {
    navigate({
      to: '/notifications',
      search: { tab: value === 'all' ? 'all' : undefined },
      replace: true,
    })
    setSelected(new Set())
  }

  const toggle = (id: number, on: boolean) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (on) next.add(id)
      else next.delete(id)
      return next
    })

  const bulk = (action: (ids: number[]) => void) => () => {
    action(selectedIds)
    setSelected(new Set())
  }

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-4xl px-4 py-6">
        <h1 className="mb-4 font-bold text-base text-fg">
          {t({ id: 'common.notifications', defaultMessage: 'Notifications' })}
        </h1>

        <div className="mb-3 flex flex-wrap items-center gap-3">
          <Checkbox
            checked={selectedIds.length > 0 && selectedIds.length === shown.length}
            indeterminate={selectedIds.length > 0 && selectedIds.length < shown.length}
            onCheckedChange={(checked) =>
              setSelected(checked === true ? new Set(shown.map((n) => n.id)) : new Set())
            }
            disabled={shown.length === 0}
            className="ml-3"
            aria-label={t({
              id: 'notificationsPage.selectAll',
              defaultMessage: 'Select all notifications',
            })}
          />
          <Tabs value={tab} onValueChange={setTab}>
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
          </Tabs>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            {selectedIds.length > 0 ? (
              <>
                <span className="text-fg-muted text-sm">
                  {t(
                    {
                      id: 'notificationsPage.selectedCount',
                      defaultMessage: '{count, plural, one {# selected} other {# selected}}',
                    },
                    { count: selectedIds.length }
                  )}
                </span>
                <Button variant="outline" size="sm" onClick={bulk(markAsRead)}>
                  {t({
                    id: 'notificationsPage.item.markAsRead',
                    defaultMessage: 'Mark as read',
                  })}
                </Button>
                <Button variant="outline" size="sm" onClick={bulk(markAsUnread)}>
                  {t({
                    id: 'notificationsPage.item.markAsUnread',
                    defaultMessage: 'Mark as unread',
                  })}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmingDelete(true)}>
                  {t({ id: 'common.delete', defaultMessage: 'Delete' })}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAsRead(unread.map((n) => n.id))}
                disabled={unread.length === 0}
              >
                {t({ id: 'common.markAllAsRead', defaultMessage: 'Mark all as read' })}
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : shown.length === 0 ? (
          <p className="py-12 text-center text-fg-muted text-sm">
            {tab === 'unread'
              ? t({ id: 'notifications.empty.unread', defaultMessage: 'No unread notifications' })
              : t({ id: 'notifications.empty.all', defaultMessage: 'No notifications yet' })}
          </p>
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-panel">
            {shown.map((n) => (
              <li key={n.id}>
                <NotificationItem
                  notification={n}
                  onMarkRead={() => markAsRead([n.id])}
                  onMarkUnread={() => markAsUnread([n.id])}
                  onDelete={() => deleteNotifications([n.id])}
                  selected={selected.has(n.id)}
                  onSelectedChange={(on) => toggle(n.id, on)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      <AlertDialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                {
                  id: 'notificationsPage.deleteConfirm.title',
                  defaultMessage:
                    '{count, plural, one {Delete # notification?} other {Delete # notifications?}}',
                },
                { count: selectedIds.length }
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t({
                id: 'notificationsPage.deleteConfirm.description',
                defaultMessage: "This can't be undone.",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t({ id: 'common.cancel', defaultMessage: 'Cancel' })}
            </AlertDialogCancel>
            <AlertDialogAction onClick={bulk(deleteNotifications)}>
              {t({ id: 'common.delete', defaultMessage: 'Delete' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
