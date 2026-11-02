import { Link } from '@tanstack/react-router'
import { Check, RotateCcw, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { useNotificationsContext } from '@/contexts/NotificationsContext'
import { useIntl } from '@/i18n'
import { formatTimeAgo } from '@/lib/date'
import { cn, initials } from '@/lib/utils'
import type { Notification } from '@/types/Notification'
import { NOTIFICATION_TYPE_NAMES } from '@/types/Notification'

interface NotificationItemProps {
  notification: Notification
  thread?: Notification[]
  threadCount?: number
  alwaysShowActions?: boolean
  showDelete?: boolean
  showCheckbox?: boolean
  isSelected?: boolean
  isIndeterminate?: boolean
  onSelectChange?: (checked: boolean) => void
  /** Called whenever a deep-link inside the item is clicked. Lets a parent dialog/popover close itself. */
  onLinkClick?: () => void
}

export const NotificationItem = ({
  notification,
  thread,
  threadCount,
  alwaysShowActions = false,
  showDelete = false,
  showCheckbox = false,
  isSelected = false,
  isIndeterminate = false,
  onSelectChange,
  onLinkClick,
}: NotificationItemProps) => {
  const { t, locale } = useIntl()
  const {
    markAsRead,
    markAsUnread,
    deleteNotification,
    markingReadId,
    markingUnreadId,
    deletingId,
    openThread,
  } = useNotificationsContext()

  const isMarkingRead = thread
    ? thread.some((n) => markingReadId === n.id)
    : markingReadId === notification.id
  const isMarkingUnread = thread
    ? thread.some((n) => markingUnreadId === n.id)
    : markingUnreadId === notification.id
  const isDeleting = thread
    ? thread.some((n) => deletingId === n.id)
    : deletingId === notification.id

  const notificationTypeName =
    NOTIFICATION_TYPE_NAMES[notification.notificationType] ||
    t({ id: 'common.notification', defaultMessage: 'Notification' })
  const createdDate = new Date(notification.created)
  const timeAgo = formatTimeAgo(createdDate, locale)

  const handleMarkAsUnread = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (notification.isRead) {
      markAsUnread(notification.id, thread)
    }
  }

  const handleMarkAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!notification.isRead) {
      markAsRead(notification.id, thread)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNotification(notification.id, thread)
  }

  const handleCheckboxChange = (checked: boolean) => {
    onSelectChange?.(checked)
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onLinkClick?.()
  }

  const actionClasses = cn(
    'pointer-events-auto size-7 shrink-0 transition-opacity',
    alwaysShowActions
      ? 'opacity-100'
      : 'opacity-0 focus-visible:opacity-100 group-hover:opacity-100'
  )
  const linkClasses =
    'pointer-events-auto truncate font-medium hover:text-blue-600 hover:underline dark:hover:text-blue-400'

  const taskLabel = notification.taskId
    ? t(
        { id: 'common.taskWithTaskId', defaultMessage: 'Task #{taskId}' },
        { taskId: notification.taskId }
      )
    : null
  const challengeRefLabel =
    notification.challengeId && !notification.challengeName
      ? t(
          { id: 'common.challengeWithChallengeId', defaultMessage: 'Challenge #{challengeId}' },
          { challengeId: notification.challengeId }
        )
      : null
  const projectRefLabel = notification.projectId
    ? t(
        { id: 'notificationsPage.item.projectRef', defaultMessage: 'Project #{projectId}' },
        { projectId: notification.projectId }
      )
    : null

  return (
    <div
      className={cn(
        'group relative transition-colors focus-within:bg-zinc-50 hover:bg-zinc-50 dark:hover:bg-slate-800/70 dark:focus-within:bg-slate-800/70',
        !notification.isRead && 'bg-blue-50/40 dark:bg-blue-950/20'
      )}
    >
      {/* Stretched hit target: covers the whole row for both mouse and keyboard,
          so clicking/activating any non-interactive part opens the thread. Real
          interactive descendants below sit above it (z-10 + pointer-events-auto)
          so they keep handling their own clicks/keyboard activation independently
          — a real <button> can't contain nested interactive children, so this row
          can't itself be role="button". */}
      <button
        type="button"
        className="absolute inset-0 z-0 cursor-pointer"
        onClick={() => openThread(notification)}
        aria-label={t({
          id: 'notificationsPage.item.openThread',
          defaultMessage: 'Open notification',
        })}
      />

      <div className="pointer-events-none relative z-10 flex items-start gap-3 px-4 py-3">
        {showCheckbox && (
          <Checkbox
            checked={isSelected}
            indeterminate={isIndeterminate}
            onCheckedChange={handleCheckboxChange}
            className="pointer-events-auto mt-1.5 shrink-0"
            aria-label={t(
              {
                id: 'notificationsPage.item.selectFrom',
                defaultMessage: 'Select notification from {from}',
              },
              {
                from:
                  notification.fromUsername ||
                  t({ id: 'notificationsPage.item.unknownSender', defaultMessage: 'unknown' }),
              }
            )}
          />
        )}

        <Avatar className="mt-0.5 size-9 shrink-0">
          <AvatarImage src={undefined} />
          <AvatarFallback className="text-xs">
            {notification.fromUsername ? initials(notification.fromUsername).slice(0, 2) : 'N'}
          </AvatarFallback>
        </Avatar>

        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* Row 1: sender · type */}
          <div className="flex min-w-0 items-center gap-1.5">
            {notification.fromUsername && (
              <span className="truncate font-semibold text-sm text-zinc-900 dark:text-white">
                {notification.fromUsername}
              </span>
            )}
            <span aria-hidden="true" className="shrink-0 text-xs text-zinc-400 dark:text-slate-500">
              ·
            </span>
            <span className="truncate text-sm text-zinc-500 dark:text-slate-400">
              {notificationTypeName}
            </span>
          </div>

          {/* Row 2: primary context — description, challenge, or extra */}
          {notification.description ? (
            <p className="truncate text-sm text-zinc-700 dark:text-slate-300">
              {notification.description}
            </p>
          ) : notification.challengeName ? (
            <p className="flex min-w-0 items-baseline gap-1 text-sm text-zinc-700 dark:text-slate-300">
              <span className="shrink-0 text-zinc-500 dark:text-slate-500">
                {t({ id: 'notificationsPage.item.challengeLabel', defaultMessage: 'Challenge:' })}
              </span>
              {notification.challengeId ? (
                <Link
                  to="/challenge/$challengeId"
                  params={{ challengeId: String(notification.challengeId) }}
                  search={{ comments: 1 }}
                  onClick={handleLinkClick}
                  className="link pointer-events-auto min-w-0 truncate font-medium"
                  title={notification.challengeName}
                >
                  {notification.challengeName}
                </Link>
              ) : (
                <span className="min-w-0 truncate font-medium" title={notification.challengeName}>
                  {notification.challengeName}
                </span>
              )}
            </p>
          ) : null}

          {/* Row 3: meta — time + entity refs */}
          <div className="flex min-w-0 items-center gap-2 text-xs text-zinc-500 dark:text-slate-500">
            <time dateTime={createdDate.toISOString()} className="shrink-0">
              {timeAgo}
            </time>
            {taskLabel && (
              <>
                <span aria-hidden="true" className="shrink-0">
                  ·
                </span>
                <Link
                  to="/tasks/$taskId"
                  params={{ taskId: String(notification.taskId) }}
                  search={{ tab: 'comments' }}
                  onClick={handleLinkClick}
                  className={linkClasses}
                  title={taskLabel}
                >
                  {taskLabel}
                </Link>
              </>
            )}
            {challengeRefLabel && (
              <>
                <span aria-hidden="true" className="shrink-0">
                  ·
                </span>
                <Link
                  to="/challenge/$challengeId"
                  params={{ challengeId: String(notification.challengeId) }}
                  search={{ comments: 1 }}
                  onClick={handleLinkClick}
                  className={linkClasses}
                  title={challengeRefLabel}
                >
                  {challengeRefLabel}
                </Link>
              </>
            )}
            {projectRefLabel && (
              <>
                <span aria-hidden="true" className="shrink-0">
                  ·
                </span>
                <Link
                  to="/manage/project/$projectId"
                  params={{ projectId: String(notification.projectId) }}
                  onClick={handleLinkClick}
                  className={linkClasses}
                  title={projectRefLabel}
                >
                  {projectRefLabel}
                </Link>
              </>
            )}
            {threadCount && threadCount > 1 && (
              <span className="ml-auto inline-flex size-4 shrink-0 items-center justify-center rounded-full bg-teal-500 font-medium text-[10px] text-white">
                {threadCount}
              </span>
            )}
          </div>
        </div>

        {/* Right side: unread dot + actions */}
        <div className="flex shrink-0 items-center gap-0.5">
          {!notification.isRead && (
            <span
              aria-hidden="true"
              className="mr-1 size-2 shrink-0 rounded-full bg-blue-500 dark:bg-blue-400"
              title={t({
                id: 'notificationsPage.item.unreadTitle',
                defaultMessage: 'Unread notification',
              })}
            />
          )}
          {!notification.isRead ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className={actionClasses}
              disabled={isMarkingRead}
              onClick={handleMarkAsRead}
              title={t({ id: 'notificationsPage.item.markAsRead', defaultMessage: 'Mark as read' })}
              aria-label={t({
                id: 'notificationsPage.item.markAsRead',
                defaultMessage: 'Mark as read',
              })}
            >
              <Check />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="icon-sm"
              className={actionClasses}
              disabled={isMarkingUnread}
              onClick={handleMarkAsUnread}
              title={t({
                id: 'notificationsPage.item.markAsUnread',
                defaultMessage: 'Mark as unread',
              })}
              aria-label={t({
                id: 'notificationsPage.item.markAsUnread',
                defaultMessage: 'Mark as unread',
              })}
            >
              <RotateCcw />
            </Button>
          )}
          {showDelete && (
            <Button
              variant="ghost"
              size="icon-sm"
              className={cn(
                actionClasses,
                'text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300'
              )}
              disabled={isDeleting}
              onClick={handleDelete}
              title={t({
                id: 'notificationsPage.item.deleteNotification',
                defaultMessage: 'Delete notification',
              })}
              aria-label={t({
                id: 'notificationsPage.item.deleteNotification',
                defaultMessage: 'Delete notification',
              })}
            >
              <Trash2 />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
