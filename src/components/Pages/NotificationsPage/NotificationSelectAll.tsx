import { useId } from 'react'
import { Checkbox } from '@/components/ui/Checkbox'
import { useNotificationsPageContext } from '@/contexts/NotificationsPageContext'
import { useIntl } from '@/i18n'

export const NotificationSelectAll = () => {
  const { t } = useIntl()
  const {
    groupByTask,
    selectedNotificationIds,
    handleSelectAll,
    allSelected,
    someSelected,
    displayNotifications,
  } = useNotificationsPageContext()

  const selectAllCheckboxId = useId()

  const totalNotificationCount = groupByTask
    ? displayNotifications.reduce((sum, n) => sum + (n.thread || [n]).length, 0)
    : displayNotifications.length

  return (
    <div className="mb-2 flex items-center gap-2 px-1">
      <Checkbox
        id={selectAllCheckboxId}
        checked={allSelected}
        indeterminate={someSelected && !allSelected}
        onCheckedChange={(checked) => handleSelectAll(checked === true)}
        aria-label={t({ id: 'notificationsPage.selectAll.ariaLabel', defaultMessage: 'Select all notifications' }
        )}
      />
      <label htmlFor={selectAllCheckboxId} className="text-sm text-zinc-600 dark:text-slate-400">
        {selectedNotificationIds.size > 0
          ? t({ id: 'notificationsPage.selectAll.selectedCount', defaultMessage: '{selected} of {total} selected' }, { selected: selectedNotificationIds.size, total: totalNotificationCount }
            )
          : t({ id: 'notificationsPage.selectAll.selectAll', defaultMessage: 'Select all' })}
      </label>
    </div>
  )
}
