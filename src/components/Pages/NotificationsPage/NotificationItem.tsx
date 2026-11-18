import { Link } from '@tanstack/react-router'
import { Bell, Check, CircleCheckBig, RotateCcw, Trash2 } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import { type TranslateFn, useIntl } from '@/i18n'
import { formatTimeAgo } from '@/lib/date'
import { cn, initials } from '@/lib/utils'
import { type Notification, NotificationType } from '@/types/Notification'

const bold = (chunks: ReactNode) => <span className="font-semibold">{chunks}</span>

const taskLink = (taskId: number) =>
  ({
    to: '/tasks/$taskId',
    params: { taskId: String(taskId) },
    search: { tab: 'comments' },
  }) as const

const challengeLink = (challengeId: number) =>
  ({
    to: '/challenge/$challengeId',
    params: { challengeId: String(challengeId) },
    search: { comments: 1 },
  }) as const

const describe = (n: Notification, t: TranslateFn) => {
  const user = n.fromUsername || t({ id: 'notifications.item.someone', defaultMessage: 'Someone' })
  const challenge = n.challengeName || n.description || ''
  const taskId = n.taskId ? String(n.taskId) : ''

  switch (n.notificationType) {
    case NotificationType.MENTION:
      return n.taskId
        ? {
            text: t(
              {
                id: 'notifications.item.mentionOnTask',
                defaultMessage: '<b>{user}</b> mentioned you on task {taskId}',
              },
              { user, taskId, b: bold }
            ),
            snippet: n.extra,
            link: taskLink(n.taskId),
          }
        : {
            text: t(
              {
                id: 'notifications.item.mentionOnChallenge',
                defaultMessage: '<b>{user}</b> mentioned you on <b>{challenge}</b>',
              },
              { user, challenge, b: bold }
            ),
            snippet: n.extra,
            link: n.challengeId ? challengeLink(n.challengeId) : undefined,
          }
    case NotificationType.CHALLENGE_COMMENT:
      return {
        text: t(
          {
            id: 'notifications.item.challengeComment',
            defaultMessage: '<b>{user}</b> commented on <b>{challenge}</b>',
          },
          { user, challenge, b: bold }
        ),
        snippet: n.extra,
        link: n.challengeId ? challengeLink(n.challengeId) : undefined,
      }
    case NotificationType.CHALLENGE_COMPLETED:
      return {
        text: t(
          {
            id: 'notifications.item.challengeCompleted',
            defaultMessage: 'Your challenge <b>{challenge}</b> is complete',
          },
          { challenge, b: bold }
        ),
        link: n.challengeId
          ? ({
              to: '/manage/challenge/$challengeId',
              params: { challengeId: String(n.challengeId) },
            } as const)
          : undefined,
      }
    case NotificationType.MAPPER_CHALLENGE_COMPLETED:
      return {
        text: t(
          {
            id: 'notifications.item.mapperChallengeCompleted',
            defaultMessage: 'A challenge you worked on is complete: <b>{challenge}</b>',
          },
          { challenge, b: bold }
        ),
        link: n.challengeId
          ? ({
              to: '/challenge/$challengeId',
              params: { challengeId: String(n.challengeId) },
            } as const)
          : undefined,
      }
    case NotificationType.TEAM:
      return {
        text: t(
          {
            id: 'notifications.item.teamInvite',
            defaultMessage: '<b>{user}</b> invited you to join <b>{team}</b>',
          },
          { user, team: n.extra ?? '', b: bold }
        ),
        // Invitations are accepted from the dashboard
        link: { to: '/dashboard' } as const,
      }
    case NotificationType.CHALLENGE_UNLOCK_REQUESTED:
      return {
        text: t(
          {
            id: 'notifications.item.unlockRequested',
            defaultMessage: '<b>{user}</b> asked you to unlock task {taskId}',
          },
          { user, taskId, b: bold }
        ),
        link: n.taskId ? taskLink(n.taskId) : undefined,
      }
    case NotificationType.SYSTEM:
      return { text: n.description ?? '' }
    default:
      // Review notifications, left over from before the review workflow was removed
      return n.taskId
        ? {
            text: t(
              {
                id: 'notifications.item.reviewed',
                defaultMessage: '<b>{user}</b> reviewed task {taskId}',
              },
              { user, taskId, b: bold }
            ),
            snippet: n.extra,
            link: taskLink(n.taskId),
          }
        : { text: n.description ?? '' }
  }
}

export const NotificationItem = ({
  notification,
  onMarkRead,
  onMarkUnread,
  onDelete,
  onNavigate,
  selected,
  onSelectedChange,
}: {
  notification: Notification
  onMarkRead: () => void
  onMarkUnread: () => void
  onDelete?: () => void
  onNavigate?: () => void
  selected?: boolean
  onSelectedChange?: (selected: boolean) => void
}) => {
  const { t, locale } = useIntl()
  const { text, snippet, link } = describe(notification, t)
  const created = new Date(notification.created)
  const sender = notification.fromUsername
  const Icon = notification.notificationType === NotificationType.SYSTEM ? Bell : CircleCheckBig

  const body = (
    <>
      {sender ? (
        <Avatar className="mt-0.5 size-8">
          <AvatarFallback className="text-xs">{initials(sender).slice(0, 2)}</AvatarFallback>
        </Avatar>
      ) : (
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-fg-muted">
          <Icon className="size-4" aria-hidden="true" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('text-sm', notification.isRead ? 'text-fg' : 'text-fg')}>{text}</span>
        {snippet && <span className="line-clamp-2 text-fg-muted text-sm">{snippet}</span>}
        <time dateTime={created.toISOString()} className="text-fg-subtle text-xs">
          {formatTimeAgo(created, locale)}
        </time>
      </span>
    </>
  )

  const actionClass = 'md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100'
  const markReadLabel = t({
    id: 'notificationsPage.item.markAsRead',
    defaultMessage: 'Mark as read',
  })
  const markUnreadLabel = t({
    id: 'notificationsPage.item.markAsUnread',
    defaultMessage: 'Mark as unread',
  })
  const deleteLabel = t({
    id: 'notificationsPage.item.deleteNotification',
    defaultMessage: 'Delete notification',
  })

  return (
    <div
      className={cn(
        'group flex items-start gap-3 px-3 py-3',
        notification.isRead ? 'bg-steel-50 dark:bg-transparent' : 'bg-white dark:bg-steel-300/10'
      )}
    >
      {onSelectedChange && (
        <Checkbox
          checked={selected}
          onCheckedChange={(checked) => onSelectedChange(checked === true)}
          className="mt-2"
          aria-label={t({
            id: 'notificationsPage.item.select',
            defaultMessage: 'Select notification',
          })}
        />
      )}
      {link ? (
        <Link
          {...link}
          onClick={() => {
            if (!notification.isRead) onMarkRead()
            onNavigate?.()
          }}
          className="flex min-w-0 flex-1 items-start gap-3 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {body}
        </Link>
      ) : (
        <div className="flex min-w-0 flex-1 items-start gap-3">{body}</div>
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        {notification.isRead ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className={actionClass}
            onClick={onMarkUnread}
            title={markUnreadLabel}
            aria-label={markUnreadLabel}
          >
            <RotateCcw />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon-sm"
            className={actionClass}
            onClick={onMarkRead}
            title={markReadLabel}
            aria-label={markReadLabel}
          >
            <Check />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            className={actionClass}
            onClick={onDelete}
            title={deleteLabel}
            aria-label={deleteLabel}
          >
            <Trash2 />
          </Button>
        )}
        {!notification.isRead && (
          <span
            className="ml-1 size-2 rounded-full bg-accent"
            role="img"
            aria-label={t({ id: 'notificationsPage.item.unread', defaultMessage: 'Unread' })}
          />
        )}
      </div>
    </div>
  )
}
