import { Link } from '@tanstack/react-router'
import { Reply } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useIntl } from '@/i18n'
import { formatTimeAgo } from '@/lib/date'
import { cn, initials } from '@/lib/utils'
import type { Comment } from '@/types/Comment'
import { CommentMarkdown } from './CommentMarkdown'

interface Props {
  comment: Comment
  variant?: 'default' | 'compact'
  showContext?: { challengeName?: boolean; taskLink?: boolean }
  onReply?: (comment: Comment) => void
  highlighted?: boolean
}

export const CommentItem = ({
  comment,
  variant = 'default',
  showContext,
  onReply,
  highlighted = false,
}: Props) => {
  const { t } = useIntl()
  const avatarSize = variant === 'compact' ? 'size-7' : 'size-9'

  return (
    <li
      data-comment-id={comment.id}
      className={cn(
        'flex gap-3 rounded-lg p-3 transition-colors',
        highlighted && 'bg-amber-50 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:ring-amber-800',
        !highlighted && variant === 'default' && 'hover:bg-zinc-50 dark:hover:bg-slate-800/40'
      )}
    >
      <Avatar className={avatarSize}>
        <AvatarImage src={comment.avatarUrl} alt={comment.osm_username} />
        <AvatarFallback>{initials(comment.osm_username)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-2 text-sm">
          <span className="font-semibold">{comment.osm_username}</span>
          <span className="text-xs text-zinc-500 dark:text-slate-400">
            {comment.created ? formatTimeAgo(new Date(comment.created)) : ''}
          </span>
          {showContext?.challengeName && comment.challengeId && (
            <Link
              to="/challenge/$challengeId"
              params={{ challengeId: String(comment.challengeId) }}
              className="text-teal-600 text-xs hover:underline dark:text-teal-400"
            >
              {t({ id: 'common.challengeWithChallengeId', defaultMessage: 'Challenge #{challengeId}' }, { challengeId: comment.challengeId }
              )}
            </Link>
          )}
          {showContext?.taskLink && comment.taskId && (
            <Link
              to="/tasks/$taskId"
              params={{ taskId: String(comment.taskId) }}
              className="text-teal-600 text-xs hover:underline dark:text-teal-400"
            >
              {t({ id: 'common.taskWithTaskId', defaultMessage: 'Task #{taskId}' }, { taskId: comment.taskId })}
            </Link>
          )}
        </div>
        <CommentMarkdown>{comment.comment}</CommentMarkdown>
        {onReply && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 h-7 px-2 text-xs"
            onClick={() => onReply(comment)}
          >
            <Reply className="size-3" aria-hidden="true" /> {t({ id: 'common.reply', defaultMessage: 'Reply' })}
          </Button>
        )}
      </div>
    </li>
  )
}
