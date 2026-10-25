import { Link } from '@tanstack/react-router'
import { ChevronRight, MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '@/api'
import type { ChallengeCommentResponse } from '@/api/challenge/comments'
import { Spinner } from '@/components/ui/Spinner'
import { useGlobalSearchContext } from '@/contexts/GlobalSearchContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import type { Comment } from '@/types/Comment'

const cardClassName = cn(
  'group flex items-start justify-between rounded-xl border border-zinc-200 bg-white px-5 py-4',
  'transition-all duration-200 hover:scale-[1.005] hover:border-zinc-300 hover:shadow-md',
  'dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900'
)

const TaskCommentCard = ({ comment }: { comment: Comment }) => {
  const { t } = useIntl()
  const { onResultSelect } = useGlobalSearchContext()
  return (
    <Link
      to="/tasks/$taskId"
      params={{
        taskId: String(comment.taskId),
      }}
      onClick={onResultSelect}
      className={cardClassName}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <p className="line-clamp-2 text-sm text-zinc-900 dark:text-white">{comment.comment}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-slate-400">
            {t(
              'appLayout.header.globalSearch.findComments.byUser',
              {
                username:
                  comment.osm_username ??
                  t('appLayout.header.globalSearch.findComments.unknownUser', undefined, 'Unknown'),
              },
              'by {username}'
            )}
          </span>
          <span className="text-xs text-zinc-400 dark:text-slate-500">
            {t('common.taskWithId', { id: comment.taskId }, 'Task #{id}')}
          </span>
        </div>
      </div>
      <ChevronRight className="mt-1 ml-4 h-5 w-5 shrink-0 text-zinc-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400" />
    </Link>
  )
}

const ChallengeCommentCard = ({ comment }: { comment: ChallengeCommentResponse }) => {
  const { t } = useIntl()
  const { onResultSelect } = useGlobalSearchContext()
  return (
    <Link
      to="/manage/challenge/$challengeId"
      params={{ challengeId: String(comment.challengeId) }}
      onClick={onResultSelect}
      className={cardClassName}
    >
      <div className="min-w-0 flex-1 space-y-2">
        <p className="line-clamp-2 text-sm text-zinc-900 dark:text-white">{comment.comment}</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 dark:text-slate-400">
            {t(
              'appLayout.header.globalSearch.findComments.byUser',
              {
                username:
                  comment.osm_username ??
                  t('appLayout.header.globalSearch.findComments.unknownUser', undefined, 'Unknown'),
              },
              'by {username}'
            )}
          </span>
          <span className="text-xs text-zinc-400 dark:text-slate-500">
            {t('common.challengeWithId', { id: comment.challengeId }, 'Challenge #{id}')}
          </span>
        </div>
      </div>
      <ChevronRight className="mt-1 ml-4 h-5 w-5 shrink-0 text-zinc-400 transition-all group-hover:translate-x-1 group-hover:text-blue-500 dark:text-slate-500 dark:group-hover:text-blue-400" />
    </Link>
  )
}

export const FindComments = ({ commentType }: { commentType: 'task' | 'challenge' }) => {
  const { t } = useIntl()
  const { searchQuery } = useGlobalSearchContext()
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const trimmed = searchQuery.trim()
  const hasSearchQuery = trimmed.length > 0
  const label =
    commentType === 'task'
      ? t('common.task', undefined, 'Task')
      : t('common.challenge', undefined, 'Challenge')
  const labelLower = label.toLowerCase()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(trimmed)
    }, 300)
    return () => clearTimeout(timer)
  }, [trimmed])

  const taskCommentResult = api.task.searchTaskComments({
    q: commentType === 'task' ? debouncedQuery : '',
    enabled: commentType === 'task',
  })
  const challengeCommentResult = api.challenge.searchChallengeComments({
    q: commentType === 'challenge' ? debouncedQuery : '',
    enabled: commentType === 'challenge',
  })

  const searchResult = commentType === 'task' ? taskCommentResult : challengeCommentResult
  const isLoading = searchResult.isLoading
  const isFetching = searchResult.isFetching
  const isDebouncePending = trimmed !== debouncedQuery

  const results =
    commentType === 'task'
      ? ((taskCommentResult.data ?? []) as Comment[])
      : ((challengeCommentResult.data ?? []) as ChallengeCommentResponse[])

  const hasResults = results.length > 0

  return (
    <div className="space-y-4">
      {(isFetching || isDebouncePending) && !isLoading && hasResults && (
        <div
          className={
            commentType === 'task'
              ? '-mx-3 -mt-3 sticky top-0 z-10 flex items-center justify-center gap-2 bg-white/90 py-2 backdrop-blur-sm dark:bg-slate-950/90'
              : 'flex items-center justify-center gap-2 py-2'
          }
        >
          <Spinner className="text-blue-500" />
          <p className="text-xs text-zinc-500 dark:text-slate-400">
            {t('common.updatingResults', undefined, 'Updating results...')}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <Spinner size="lg" className="text-blue-500" />
          <p className="text-sm text-zinc-500 dark:text-slate-400">
            {t(
              'appLayout.header.globalSearch.findComments.loading',
              undefined,
              'Loading comments...'
            )}
          </p>
        </div>
      ) : !hasResults ? (
        <div className="flex flex-col items-center justify-center gap-3 py-12">
          <div className="rounded-full bg-zinc-100 p-3 dark:bg-slate-800">
            <MessageCircle className="h-6 w-6 text-zinc-400 dark:text-slate-500" />
          </div>
          <div className="space-y-1 text-center">
            <p className="font-medium text-sm text-zinc-900 dark:text-white">
              {hasSearchQuery
                ? t('common.noResultsFound', undefined, 'No results found')
                : t(
                    'appLayout.header.globalSearch.findComments.noCommentsYet',
                    { label: labelLower },
                    'No {label} comments yet'
                  )}
            </p>
            {hasSearchQuery && (
              <p className="text-xs text-zinc-500 dark:text-slate-400">
                {t(
                  'appLayout.header.globalSearch.findComments.noCommentsMatch',
                  { label: labelLower, query: debouncedQuery },
                  'No {label} comments match "{query}"'
                )}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-sm text-zinc-700 dark:text-slate-300">
              {hasSearchQuery
                ? t('common.results', undefined, 'Results')
                : t(
                    'appLayout.header.globalSearch.findComments.recentComments',
                    { label },
                    'Recent {label} Comments'
                  )}
            </h3>
            <span className="text-xs text-zinc-500 dark:text-slate-400">
              {t(
                'appLayout.header.globalSearch.findComments.commentCount',
                { count: results.length },
                '{count, plural, one {# comment} other {# comments}}'
              )}
            </span>
          </div>
          <div className="space-y-2">
            {commentType === 'task'
              ? (results as Comment[]).map((comment) => (
                  <TaskCommentCard key={comment.id} comment={comment} />
                ))
              : (results as ChallengeCommentResponse[]).map((comment) => (
                  <ChallengeCommentCard key={comment.id} comment={comment} />
                ))}
          </div>
        </div>
      )}
    </div>
  )
}
