import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useNotificationsPageContext } from '@/contexts/NotificationsPageContext'
import { useIntl } from '@/i18n'

export const NotificationToolbar = () => {
  const { t } = useIntl()
  const {
    activeTab,
    setActiveTab,
    filteredUnreadCount,
    filteredAllCount,
    selectedNotificationIds,
    allSelectedAreRead,
    handleMarkSelectedAsRead,
    handleMarkSelectedAsUnread,
    isMarkingSelected,
    filteredNotifications,
  } = useNotificationsPageContext()

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'unread' | 'all')}>
        <TabsList>
          <TabsTrigger value="unread">
            {t(
              { id: 'common.unread', defaultMessage: 'Unread ({count})' },
              { count: filteredUnreadCount }
            )}
          </TabsTrigger>
          <TabsTrigger value="all">
            {t({ id: 'common.all', defaultMessage: 'All ({count})' }, { count: filteredAllCount })}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex flex-wrap items-center gap-2">
        {allSelectedAreRead ? (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkSelectedAsUnread}
            disabled={isMarkingSelected || filteredNotifications.length === 0}
          >
            {isMarkingSelected
              ? t({ id: 'notificationsPage.toolbar.marking', defaultMessage: 'Marking...' })
              : selectedNotificationIds.size > 0
                ? t(
                    {
                      id: 'notificationsPage.toolbar.markSelectedUnread',
                      defaultMessage: 'Mark {count, number} as unread',
                    },
                    { count: selectedNotificationIds.size }
                  )
                : t({
                    id: 'notificationsPage.toolbar.markAllUnread',
                    defaultMessage: 'Mark all as unread',
                  })}
          </Button>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkSelectedAsRead}
            disabled={isMarkingSelected || filteredNotifications.length === 0}
          >
            {isMarkingSelected
              ? t({ id: 'notificationsPage.toolbar.marking', defaultMessage: 'Marking...' })
              : selectedNotificationIds.size > 0
                ? t(
                    {
                      id: 'notificationsPage.toolbar.markSelectedRead',
                      defaultMessage: 'Mark {count, number} as read',
                    },
                    { count: selectedNotificationIds.size }
                  )
                : t({ id: 'common.markAllAsRead', defaultMessage: 'Mark all as read' })}
          </Button>
        )}
      </div>
    </div>
  )
}
