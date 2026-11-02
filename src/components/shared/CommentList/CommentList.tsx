import { useEffect, useRef } from 'react'
import { useIntl } from '@/i18n'
import type { Comment } from '@/types/Comment'
import { CommentItem } from './CommentItem'
import { sortComments } from './commentSorting'

interface Props {
  comments: Comment[]
  variant?: 'default' | 'compact'
  showContext?: { challengeName?: boolean; taskLink?: boolean }
  emptyStateText?: string
  orderBy?: 'asc' | 'desc'
  onReply?: (comment: Comment) => void
  highlightCommentId?: number
}

export const CommentList = ({
  comments,
  variant = 'default',
  showContext,
  emptyStateText,
  orderBy = 'desc',
  onReply,
  highlightCommentId,
}: Props) => {
  const { t } = useIntl()
  const containerRef = useRef<HTMLUListElement>(null)
  const resolvedEmptyStateText =
    emptyStateText ?? t({ id: 'commentList.list.empty', defaultMessage: 'No comments yet' })

  useEffect(() => {
    if (!highlightCommentId || !containerRef.current) return
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-comment-id="${highlightCommentId}"]`
    )
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightCommentId])

  if (!comments.length) {
    return (
      <p className="py-4 text-center text-sm text-zinc-500 dark:text-slate-400">
        {resolvedEmptyStateText}
      </p>
    )
  }

  const ordered = sortComments(comments, orderBy)

  return (
    <ul ref={containerRef} className="flex flex-col gap-1">
      {ordered.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          variant={variant}
          showContext={showContext}
          onReply={onReply}
          highlighted={comment.id === highlightCommentId}
        />
      ))}
    </ul>
  )
}
