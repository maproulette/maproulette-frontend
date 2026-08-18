import {
  AlertTriangle,
  ArrowRight,
  Ban,
  CheckCheck,
  CheckCircle2,
  Circle,
  HelpCircle,
  type LucideIcon,
  MessageCircleQuestion,
  MessageSquare,
  Send,
  ShieldCheck,
  SkipForward,
  Trash2,
  XCircle,
} from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { api } from '@/api'
import { TaskContext } from '@/components/Pages/TaskEditPage/contexts/TaskContext'
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Textarea } from '@/components/ui/Textarea'
import { useAuthContext } from '@/contexts/AuthContext'
import { useAvatarContext } from '@/contexts/AvatarContext'
import { usePluginContext } from '@/contexts/PluginContext'
import { useIntl } from '@/i18n'
import { formatDate, formatDateTime } from '@/lib/date'
import { logger } from '@/lib/logger'
import { markdownRemarkPlugins } from '@/lib/markdown'
import {
  getStatusLabel,
  STATUS_BAR_COLORS,
  STATUS_PILL_COLORS,
  STATUS_TINT_COLORS,
} from '@/lib/taskConstants'
import { cn } from '@/lib/utils'
import type { TaskHistoryAction } from '@/types/Task'

// Action types from the API — must match backend TaskLogEntry constants
const ACTION_TYPE = {
  COMMENT: 0,
  STATUS_CHANGE: 1,
  UPDATE: 3,
} as const

const STATUS_ICONS: Record<number, LucideIcon> = {
  0: Circle,
  1: CheckCircle2,
  2: XCircle,
  3: SkipForward,
  4: Trash2,
  5: CheckCheck,
  6: AlertTriangle,
  7: MessageCircleQuestion,
  8: ShieldCheck,
  9: Ban,
}

const DEFAULT_PILL_CLASS =
  'bg-zinc-100 text-zinc-700 ring-zinc-300/60 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700/60'
const DEFAULT_BAR_CLASS = 'bg-zinc-400'
const DEFAULT_TINT_CLASS = 'from-zinc-100/80 dark:from-zinc-800/30'

type StatusVisual = {
  icon: LucideIcon
  pill: string
  bar: string
  tint: string
}

const getStatusVisual = (status: number | undefined): StatusVisual | null => {
  if (status === undefined) return null
  return {
    icon: STATUS_ICONS[status] ?? HelpCircle,
    pill: STATUS_PILL_COLORS[status] ?? DEFAULT_PILL_CLASS,
    bar: STATUS_BAR_COLORS[status] ?? DEFAULT_BAR_CLASS,
    tint: STATUS_TINT_COLORS[status] ?? DEFAULT_TINT_CLASS,
  }
}

const StatusPill = ({ status, muted = false }: { status: number; muted?: boolean }) => {
  const { t } = useIntl()
  const Icon = STATUS_ICONS[status] ?? HelpCircle
  const pill = STATUS_PILL_COLORS[status] ?? DEFAULT_PILL_CLASS
  const label =
    getStatusLabel(t, status) ?? t('common.statusWithStatus', { status }, 'Status {status}')
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-medium text-[11px] ring-1 ring-inset',
        pill,
        muted && 'opacity-60'
      )}
    >
      <Icon className="size-3" />
      {label}
    </span>
  )
}

export const CommentsHistoryTab = ({
  taskId: taskIdProp,
  readOnly = false,
}: {
  taskId?: number
  readOnly?: boolean
} = {}) => {
  const { t } = useIntl()
  const taskContext = useContext(TaskContext)
  const taskId = taskIdProp ?? taskContext?.task.id
  const resolvedTaskId = taskId ?? 0
  const { user } = useAuthContext()
  const [commentText, setCommentText] = useState('')
  const { handleImageError, getImageSrc } = useAvatarContext()
  const { taskHistoryItemRenderers } = usePluginContext()

  const { data: taskHistory = [], isLoading } = api.task.getTaskHistory(resolvedTaskId)
  const addCommentMutation = api.task.useAddTaskComment()
  const userOsmId = user?.osmProfile?.id

  const sortedHistory = useMemo(() => {
    return [...taskHistory].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )
  }, [taskHistory])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (readOnly || !resolvedTaskId) return
    if (!commentText.trim()) {
      toast.error(t('common.pleaseEnterAComment', undefined, 'Please enter a comment'))
      return
    }
    if (!user) {
      toast.error(
        t('common.youMustBeLoggedInToComment', undefined, 'You must be logged in to comment')
      )
      return
    }
    addCommentMutation.mutate(
      { taskId: resolvedTaskId, commentText: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('')
          toast.success(t('taskInfoPanel.comments.addSuccess', undefined, 'Comment added'))
        },
        onError: (error) => {
          logger.error('Error adding comment', { error })
          toast.error(t('common.failedToAddComment', undefined, 'Failed to add comment'))
        },
      }
    )
  }

  if (!resolvedTaskId) {
    return null
  }

  const renderHistoryItem = (item: TaskHistoryAction, index: number) => {
    const timestamp = new Date(item.timestamp)
    const userName =
      item.user?.username ?? t('taskInfoPanel.comments.systemUser', undefined, 'System')

    if (item.actionType === ACTION_TYPE.UPDATE) {
      return null
    }

    if (item.actionType === ACTION_TYPE.COMMENT && item.comment) {
      const commentText = typeof item.comment === 'string' ? item.comment : item.comment.comment
      const commentObj = typeof item.comment === 'object' ? item.comment : null
      const commentUserName = commentObj?.osm_username ?? userName
      const commentAvatarUrl = commentObj?.avatarUrl
      const isUser = commentObj ? commentObj.osm_id === userOsmId : false

      return (
        <div
          key={`comment-${index}`}
          className={cn('flex min-w-0 gap-2', isUser && 'flex-row-reverse')}
        >
          <div className="flex-shrink-0">
            <img
              src={getImageSrc(commentAvatarUrl)}
              alt={commentUserName}
              className="size-8 rounded-full border border-zinc-200 dark:border-slate-700"
              onError={() => commentAvatarUrl && handleImageError(commentAvatarUrl)}
              loading="lazy"
            />
          </div>

          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col gap-1 rounded-2xl px-3 py-2.5 shadow-xs ring-1',
              isUser
                ? 'bg-blue-100 ring-blue-200/70 dark:bg-blue-950 dark:ring-blue-800/70'
                : 'bg-white ring-zinc-200/80 dark:bg-slate-950 dark:ring-slate-600/80'
            )}
          >
            <div className="flex items-center gap-2">
              <a
                href={`https://www.openstreetmap.org/user/${encodeURIComponent(commentUserName)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-600 text-xs hover:underline dark:text-blue-400"
              >
                {commentUserName}
              </a>
            </div>

            <div className="prose prose-sm dark:prose-invert max-w-none break-words text-xs [&_*]:break-words [&_a]:text-blue-600 [&_a]:hover:underline dark:[&_a]:text-blue-400">
              <ReactMarkdown
                remarkPlugins={markdownRemarkPlugins}
                components={{
                  a: ({ ...props }) => (
                    <a
                      {...props}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    />
                  ),
                }}
              >
                {commentText}
              </ReactMarkdown>
            </div>

            <div className="text-xs text-zinc-500 dark:text-slate-400">
              {formatDateTime(timestamp)}
            </div>
          </div>
        </div>
      )
    }

    if (item.actionType === ACTION_TYPE.STATUS_CHANGE) {
      const oldVisual = getStatusVisual(item.oldStatus)
      const newVisual = getStatusVisual(item.status) ??
        oldVisual ?? {
          icon: HelpCircle,
          pill: DEFAULT_PILL_CLASS,
          bar: DEFAULT_BAR_CLASS,
          tint: DEFAULT_TINT_CLASS,
        }

      return (
        <div
          key={`status-${item.timestamp}-${index}`}
          title={formatDateTime(timestamp)}
          className={cn(
            'relative flex flex-wrap items-center gap-2 overflow-hidden rounded-lg bg-gradient-to-r to-transparent py-2 pr-3 pl-4 text-xs',
            newVisual.tint
          )}
        >
          <div className={cn('absolute top-0 bottom-0 left-0 w-1', newVisual.bar)} />
          <span className="font-medium text-zinc-700 dark:text-slate-200">{userName}</span>
          {item.oldStatus !== undefined && item.status !== undefined ? (
            <>
              <StatusPill status={item.oldStatus} muted />
              <ArrowRight className="size-3 text-zinc-400 dark:text-slate-500" />
              <StatusPill status={item.status} />
            </>
          ) : item.status !== undefined ? (
            <>
              <span className="text-zinc-500 dark:text-slate-400">
                {t('taskInfoPanel.comments.markedAs', undefined, 'marked as')}
              </span>
              <StatusPill status={item.status} />
            </>
          ) : item.oldStatus !== undefined ? (
            <>
              <span className="text-zinc-500 dark:text-slate-400">
                {t('taskInfoPanel.comments.cleared', undefined, 'cleared')}
              </span>
              <StatusPill status={item.oldStatus} muted />
            </>
          ) : (
            <span className="text-zinc-500 dark:text-slate-400">
              {t('taskInfoPanel.comments.changedStatus', undefined, 'changed status')}
            </span>
          )}
          <span className="ml-auto text-zinc-400 dark:text-slate-500">{formatDate(timestamp)}</span>
        </div>
      )
    }

    const pluginItem = item as import('@/types/Plugin').PluginTaskHistoryItem
    for (const renderer of taskHistoryItemRenderers) {
      if (!renderer.canRender(pluginItem)) continue
      const Renderer = renderer.component
      return (
        <Renderer key={`plugin-history-${renderer.id}-${index}`} item={pluginItem} index={index} />
      )
    }

    return null
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-3 pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
            </div>
          ) : sortedHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <MessageSquare className="mb-2 size-8 text-zinc-400 dark:text-slate-500" />
              <p className="text-sm text-zinc-500 dark:text-slate-400">
                {readOnly
                  ? t('taskInfoPanel.comments.emptyStateReadOnly', undefined, 'No activity yet.')
                  : t(
                      'taskInfoPanel.comments.emptyState',
                      undefined,
                      'No activity yet. Be the first to comment!'
                    )}
              </p>
            </div>
          ) : (
            sortedHistory
              .map((item, index) => renderHistoryItem(item, index))
              .filter((item) => item !== null)
          )}
        </div>
      </ScrollArea>

      {!readOnly &&
        (user ? (
          <form
            onSubmit={handleSubmit}
            className="mt-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-xs dark:border-slate-600 dark:bg-slate-950"
          >
            <div className="flex gap-2">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={t('common.addAComment', undefined, 'Add a comment...')}
                rows={2}
                className="flex-1 resize-none bg-zinc-50 text-sm dark:border-slate-600 dark:bg-slate-900"
                maxLength={5000}
              />
              <Button
                type="submit"
                size="sm"
                disabled={!commentText.trim() || addCommentMutation.isPending}
                className="self-end"
              >
                <Send className="size-3.5" />
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-center text-xs text-zinc-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
            {t('taskInfoPanel.comments.signInPrompt', undefined, 'Sign in to add comments')}
          </div>
        ))}
    </div>
  )
}
