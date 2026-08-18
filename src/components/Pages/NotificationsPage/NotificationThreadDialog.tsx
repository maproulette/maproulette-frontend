import { Link } from '@tanstack/react-router'
import { Bell, CheckCheck, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { CommentComposer } from '@/components/shared/CommentComposer'
import { CommentList } from '@/components/shared/CommentList'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useAuthContext } from '@/contexts/AuthContext'
import { useNotificationsContext } from '@/contexts/NotificationsContext'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'
import { NotificationItem } from './NotificationItem'

interface NotificationThreadDialogProps {
  onViewAll?: () => void
}

export const NotificationThreadDialog = ({ onViewAll }: NotificationThreadDialogProps = {}) => {
  const { t } = useIntl()
  const { openNotificationThread: thread, closeThread, markAllAsRead } = useNotificationsContext()
  const { user } = useAuthContext()

  const isOpen = thread !== null
  const isThread = (thread?.length ?? 0) > 1
  const taskId = thread?.[0]?.taskId
  const challengeRef = thread?.[0]?.challengeName

  // Load task comments when thread is task-scoped so users have full context.
  // Falls back gracefully when taskId is undefined (enabled guard inside hook).
  const { data: taskComments = [], isLoading: commentsLoading } = api.task.getTaskComments(
    taskId ?? 0
  )
  const addCommentMutation = api.task.useAddTaskComment()

  const [replyValue, setReplyValue] = useState('')

  const unreadIds = useMemo(
    () => (thread ?? []).filter((n) => !n.isRead).map((n) => n.id),
    [thread]
  )

  const handleMarkThreadRead = () => {
    if (unreadIds.length === 0) return
    // Reason: markAllAsRead dispatches the bulk PUT endpoint with all thread
    // notification IDs in a single request.
    markAllAsRead(unreadIds)
  }

  const handleReplySubmit = async (value: string) => {
    if (!taskId) return
    const trimmed = value.trim()
    if (!trimmed) return
    try {
      await addCommentMutation.mutateAsync({ taskId, commentText: trimmed })
      setReplyValue('')
      toast.success(t('notificationsPage.thread.replyPosted', undefined, 'Reply posted'))
    } catch (error) {
      logger.error('Failed to post reply from notification thread', {
        error,
        taskId,
      })
      toast.error(t('notificationsPage.thread.replyFailed', undefined, 'Failed to post reply'))
      // Re-throw so the composer can exit its busy state via its finally block.
      throw error
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeThread()}>
      <DialogContent
        size={isThread || taskId ? 'xl' : 'md'}
        className="max-h-[85vh] overflow-y-auto"
      >
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Bell className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle>
                {isThread
                  ? t(
                      'notificationsPage.thread.title.count',
                      { count: thread?.length ?? 0 },
                      '{count} notifications'
                    )
                  : taskId
                    ? t(
                        'notificationsPage.thread.title.task',
                        { taskId },
                        'Notification for Task #{taskId}'
                      )
                    : t('common.notification', undefined, 'Notification')}
              </DialogTitle>
              <DialogDescription>
                {isThread
                  ? t(
                      'notificationsPage.thread.description.groupedForTask',
                      {
                        ref: taskId
                          ? t('common.taskWithTaskId', { taskId }, 'Task #{taskId}')
                          : (challengeRef ??
                            t(
                              'notificationsPage.thread.description.thisThread',
                              undefined,
                              'this thread'
                            )),
                      },
                      'Grouped together for {ref}'
                    )
                  : t(
                      'notificationsPage.thread.description.viewDetails',
                      undefined,
                      'View notification details'
                    )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-slate-700">
          <ul className="divide-y divide-zinc-200 dark:divide-slate-700">
            {thread?.map((notification) => (
              <li key={notification.id}>
                <NotificationItem
                  notification={notification}
                  alwaysShowActions
                  onLinkClick={closeThread}
                />
              </li>
            ))}
          </ul>
        </div>

        {taskId ? (
          <section
            aria-label={t(
              'notificationsPage.thread.commentsSectionLabel',
              undefined,
              'Task comment thread'
            )}
            className="mt-4 space-y-3 border-zinc-200 border-t pt-4 dark:border-slate-700"
          >
            <h3 className="font-medium text-sm text-zinc-900 dark:text-slate-100">
              {t('notificationsPage.thread.commentsHeading', undefined, 'Comments on this task')}
            </h3>
            {commentsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="size-5 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-slate-600 dark:border-t-slate-300" />
              </div>
            ) : (
              <CommentList
                comments={taskComments}
                variant="compact"
                emptyStateText={t(
                  'notificationsPage.thread.noComments',
                  undefined,
                  'No comments on this task yet'
                )}
                orderBy="asc"
              />
            )}

            {user ? (
              <div className="border-zinc-200 border-t pt-3 dark:border-slate-700">
                <CommentComposer
                  value={replyValue}
                  onChange={setReplyValue}
                  onSubmit={handleReplySubmit}
                  placeholder={t(
                    'notificationsPage.thread.replyPlaceholder',
                    { taskId },
                    'Reply on Task #{taskId}…'
                  )}
                  submitLabel={t('common.reply', undefined, 'Reply')}
                  disabled={addCommentMutation.isPending}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center text-xs text-zinc-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                {t('notificationsPage.thread.signInToReply', undefined, 'Sign in to reply')}
              </div>
            )}
          </section>
        ) : null}

        <DialogFooter className="flex-wrap gap-2 sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleMarkThreadRead}
              disabled={unreadIds.length === 0}
            >
              <CheckCheck className="size-4" aria-hidden="true" />
              {unreadIds.length > 0
                ? t(
                    'notificationsPage.thread.markThreadReadCount',
                    { count: unreadIds.length },
                    'Mark thread as read ({count})'
                  )
                : t('notificationsPage.thread.markThreadRead', undefined, 'Mark thread as read')}
            </Button>
            {taskId ? (
              <Button variant="outline" asChild>
                <Link
                  to="/tasks/$taskId"
                  params={{ taskId: String(taskId) }}
                  search={{ tab: 'comments' }}
                  onClick={closeThread}
                >
                  {t('notificationsPage.thread.openTask', undefined, 'Open task')}
                  <ExternalLink className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            ) : null}
          </div>
          {onViewAll && (
            <Button variant="ghost" onClick={onViewAll}>
              {t('common.viewAllNotifications', undefined, 'View all notifications')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
