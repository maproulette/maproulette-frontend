import { Link } from '@tanstack/react-router'
import { MessageSquare, Send } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import { api } from '@/api'
import { useBrowsedChallengeContext } from '@/components/Pages/BrowsedChallengePage/contexts/BrowsedChallengeContext'
import { Button } from '@/components/ui/Button'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Textarea } from '@/components/ui/Textarea'
import { useAuthContext } from '@/contexts/AuthContext'
import { useAvatarContext } from '@/contexts/AvatarContext'
import { useIntl } from '@/i18n'
import { formatDateTime } from '@/lib/date'
import { logger } from '@/lib/logger'
import { markdownRemarkPlugins } from '@/lib/markdown'
import { cn } from '@/lib/utils'

interface ChallengeComment {
  id: number
  osm_id: number
  osm_username: string
  avatarUrl: string
  challengeId: number
  projectId: number
  created: number
  comment: string
  taskId?: number
}

export const ChallengeComments = () => {
  const { t } = useIntl()
  const { challenge } = useBrowsedChallengeContext()
  const challengeId = challenge.id ?? 0
  const ownerId = challenge.owner
  const { user } = useAuthContext()
  const [commentText, setCommentText] = useState('')
  const [showTaskComments, setShowTaskComments] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { handleImageError, getImageSrc } = useAvatarContext()

  const { data: challengeComments = [] } = api.challenge.getChallengeComments(challengeId)

  const { data: taskCommentsData } = api.challenge.getTaskComments(challengeId)

  const allComments: ChallengeComment[] = []

  if (challengeComments && Array.isArray(challengeComments)) {
    allComments.push(...challengeComments.map((c) => ({ ...c, taskId: undefined })))
  }

  if (showTaskComments && taskCommentsData) {
    Object.entries(taskCommentsData).forEach(([taskId, comments]) => {
      if (Array.isArray(comments)) {
        allComments.push(...comments.map((c) => ({ ...c, taskId: parseInt(taskId, 10) })))
      }
    })
  }

  const sortedComments = [...allComments].sort((a, b) => a.created - b.created)

  const addCommentMutation = api.challenge.useAddChallengeComment()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
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
      { challengeId, comment: commentText.trim() },
      {
        onSuccess: () => {
          setCommentText('')
          toast.success(
            t(
              'browsedChallengePage.challengeModals.comments.addSuccess',
              undefined,
              'Comment added successfully'
            )
          )
          setTimeout(() => {
            commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
          }, 100)
        },
        onError: (error) => {
          logger.error('Error adding comment', { error })
          toast.error(t('common.failedToAddComment', undefined, 'Failed to add comment'))
        },
      }
    )
  }

  useEffect(() => {
    if (sortedComments.length > 0) {
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, [sortedComments.length, showTaskComments])

  const userOsmId = user?.osmProfile?.id

  return (
    <div className="flex h-full min-h-0 flex-col">
      {taskCommentsData && Object.keys(taskCommentsData).length > 0 && (
        <div className="mb-4 flex items-center justify-end gap-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={showTaskComments}
              onChange={(e) => setShowTaskComments(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-2 focus:ring-blue-500 dark:border-slate-600"
            />
            <span>
              {t(
                'browsedChallengePage.challengeModals.comments.showTaskComments',
                undefined,
                'Show task comments'
              )}
            </span>
          </label>
        </div>
      )}

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 pr-4">
          {sortedComments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <MessageSquare className="mb-2 size-8 text-zinc-400 dark:text-slate-500" />
              <p className="text-sm text-zinc-500 dark:text-slate-400">
                {t(
                  'browsedChallengePage.challengeModals.comments.empty',
                  undefined,
                  'No comments yet. Be the first to comment!'
                )}
              </p>
            </div>
          ) : (
            sortedComments.map((comment) => {
              const isUser = comment.osm_id === userOsmId
              const isOwner = comment.osm_id === ownerId

              return (
                <div
                  key={`${comment.id}-${comment.taskId || 'challenge'}`}
                  className={cn('flex min-w-0 gap-3', isUser && 'flex-row-reverse')}
                >
                  <div className="flex-shrink-0">
                    <img
                      src={getImageSrc(comment.avatarUrl)}
                      alt={comment.osm_username}
                      className="size-10 rounded-full border-2 border-zinc-200 dark:border-slate-700"
                      onError={() => handleImageError(comment.avatarUrl)}
                      loading="lazy"
                    />
                  </div>

                  <div
                    className={cn(
                      'flex min-w-0 flex-1 flex-col gap-2 rounded-lg p-3',
                      isUser ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-zinc-100 dark:bg-slate-800'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <a
                        href={`https://www.openstreetmap.org/user/${encodeURIComponent(comment.osm_username)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-blue-600 text-sm hover:underline dark:text-blue-400"
                      >
                        {comment.osm_username}
                      </a>
                      {isOwner && (
                        <span className="rounded bg-yellow-100 px-2 py-0.5 font-medium text-xs text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                          {t(
                            'browsedChallengePage.challengeModals.comments.owner',
                            undefined,
                            'Owner'
                          )}
                        </span>
                      )}
                      {comment.taskId && (
                        <Link
                          to="/tasks/$taskId"
                          params={{ taskId: String(comment.taskId) }}
                          className="text-xs text-zinc-500 hover:underline dark:text-slate-400"
                        >
                          {t(
                            'browsedChallengePage.challengeModals.comments.reTask',
                            { taskId: comment.taskId },
                            'Re: Task {taskId}'
                          )}
                        </Link>
                      )}
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_*]:break-words [&_a]:text-blue-600 [&_a]:hover:underline dark:[&_a]:text-blue-400">
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
                        {comment.comment}
                      </ReactMarkdown>
                    </div>

                    <div className="text-xs text-zinc-500 dark:text-slate-400">
                      {formatDateTime(new Date(comment.created))}
                    </div>
                  </div>
                </div>
              )
            })
          )}
          <div ref={commentsEndRef} />
        </div>
      </ScrollArea>

      {user ? (
        <form
          onSubmit={handleSubmit}
          className="mt-4 border-zinc-200 border-t pt-4 dark:border-slate-700"
        >
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder={t('common.addAComment', undefined, 'Add a comment...')}
              rows={3}
              className="flex-1 resize-none whitespace-pre-wrap break-words"
              style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
              maxLength={5000}
            />
            <Button
              type="submit"
              disabled={!commentText.trim() || addCommentMutation.isPending}
              className="self-end"
            >
              <Send className="size-4" />
              {addCommentMutation.isPending
                ? t(
                    'browsedChallengePage.challengeModals.comments.sending',
                    undefined,
                    'Sending...'
                  )
                : t('browsedChallengePage.challengeModals.comments.send', undefined, 'Send')}
            </Button>
          </div>
          <p className="mt-1 text-xs text-zinc-500 dark:text-slate-400">
            {t(
              'browsedChallengePage.challengeModals.comments.characterCount',
              { count: commentText.length, max: 5000 },
              '{count}/{max} characters'
            )}
          </p>
        </form>
      ) : (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          {t(
            'browsedChallengePage.challengeModals.comments.signInRequired',
            undefined,
            'Please sign in to add comments'
          )}
        </div>
      )}
    </div>
  )
}
