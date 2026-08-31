import { Link } from '@tanstack/react-router'
import { Pencil, Share2 } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/api'
import { useBrowsedProjectContext } from '@/components/Pages/BrowsedProjectPage/contexts/BrowsedProjectContext'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/Button'
import { Progress } from '@/components/ui/Progress'
import { ScrollArea } from '@/components/ui/ScrollArea'
import { Separator } from '@/components/ui/Separator'
import { useIntl } from '@/i18n'
import { formatDate } from '@/lib/date'
import { logger } from '@/lib/logger'

export const ProjectDetail = () => {
  const { t } = useIntl()
  const { project } = useBrowsedProjectContext()
  const { data: challenges = [] } = api.project.getProjectChallenges(project.id)

  const remainingTasks = challenges.reduce(
    (sum, c) => sum + (c.completionMetrics?.tasksRemaining ?? 0),
    0
  )
  const totalTasks = challenges.reduce((sum, c) => sum + (c.completionMetrics?.total ?? 0), 0)
  const completedTasks = totalTasks - remainingTasks
  const completionPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

  const handleShare = async () => {
    const url = `${window.location.origin}/project/${project.id}`
    try {
      if (navigator.share) {
        await navigator.share({
          title: project.displayName || project.name,
          url,
        })
      } else {
        await navigator.clipboard.writeText(url)
        toast.success(t('common.linkCopiedToClipboard', undefined, 'Link copied to clipboard'))
      }
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url)
          toast.success(t('common.linkCopiedToClipboard', undefined, 'Link copied to clipboard'))
        } catch (clipboardError) {
          logger.error('Error copying to clipboard', { error: clipboardError })
          toast.error(
            t('browsedProjectPage.projectDetail.shareError', undefined, 'Failed to share project')
          )
        }
      }
    }
  }

  return (
    <aside className="h-full min-h-0 overflow-hidden pr-2">
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200/40 bg-white shadow-sm dark:border-slate-700/40 dark:bg-slate-800">
        {/* Header */}
        <div className="space-y-2.5 px-6 pt-6 pb-4">
          {(project.featured || project.isArchived) && (
            <ul className="flex flex-wrap items-center gap-2.5">
              {project.featured && (
                <li>
                  <span className="font-medium text-cyan-500 text-xs uppercase tracking-wide dark:text-cyan-400">
                    {t('common.featured', undefined, 'Featured')}
                  </span>
                </li>
              )}
              {project.isArchived && (
                <li>
                  <span className="font-medium text-xs text-zinc-500 uppercase tracking-wide dark:text-zinc-400">
                    {t('common.archived', undefined, 'Archived')}
                  </span>
                </li>
              )}
            </ul>
          )}

          <h1 className="line-clamp-2 font-bold text-base text-zinc-900 leading-tight tracking-tight dark:text-zinc-50">
            {project.displayName || project.name}
          </h1>

          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0 font-medium text-xs text-zinc-600 dark:text-zinc-400">
            <StatusBadge enabled={project.enabled || false} />
            <span className="text-zinc-400 dark:text-zinc-500">•</span>
            <span className="whitespace-nowrap">
              {t('common.idNumber', { id: project.id ?? '' }, 'ID {id}')}
            </span>
            {project.owner && (
              <>
                <span className="text-zinc-400 dark:text-zinc-500">•</span>
                <span className="whitespace-nowrap">
                  {t(
                    'browsedProjectPage.projectDetail.byOwner',
                    { owner: project.owner },
                    'by {owner}'
                  )}
                </span>
              </>
            )}
          </div>

          {/* Action button row — mirrors browse challenge panel's pill row */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link to="/manage/project/$projectId" params={{ projectId: String(project.id) }}>
              <Button variant="outline" size="sm" className="gap-1.5 rounded-full">
                <Pencil className="size-4" />
                {t('common.manage', undefined, 'Manage')}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 rounded-full"
              onClick={handleShare}
            >
              <Share2 className="size-3.5" />
              {t('common.share', undefined, 'Share')}
            </Button>
          </div>
        </div>

        {project.description && (
          <div className="border-zinc-200/50 border-t px-6 py-4 dark:border-slate-700/50">
            <p className="text-pretty text-sm text-zinc-700 leading-relaxed dark:text-zinc-300">
              {project.description}
            </p>
          </div>
        )}

        {/* Scrollable stats area */}
        <div className="flex-1 border-zinc-200/50 border-t dark:border-slate-700/50">
          <ScrollArea className="h-full">
            <div className="space-y-4 px-6 py-4 text-sm">
              {totalTasks > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {t(
                        'browsedProjectPage.projectDetail.percentComplete',
                        { percent: Math.round(completionPercentage) },
                        '{percent}% complete'
                      )}
                    </span>
                    <span className="text-zinc-500 dark:text-zinc-400">
                      {completedTasks.toLocaleString()} / {totalTasks.toLocaleString()}
                    </span>
                  </div>
                  <Progress value={completionPercentage} className="h-2" />
                </div>
              )}

              <Separator />

              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {t('common.challenges', undefined, 'Challenges')}
                </span>
                <span className="font-semibold tabular-nums">{challenges.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-600 dark:text-zinc-400">
                  {t('common.tasksRemaining', undefined, 'Tasks remaining')}
                </span>
                <span className="font-semibold tabular-nums">
                  {remainingTasks.toLocaleString()}
                </span>
              </div>

              {(project.created || project.modified) && (
                <>
                  <Separator />
                  {project.created && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {t('common.created', undefined, 'Created')}
                      </span>
                      <span className="font-medium">{formatDate(new Date(project.created))}</span>
                    </div>
                  )}
                  {project.modified && (
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-600 dark:text-zinc-400">
                        {t('common.modified', undefined, 'Modified')}
                      </span>
                      <span className="font-medium">{formatDate(new Date(project.modified))}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </aside>
  )
}
