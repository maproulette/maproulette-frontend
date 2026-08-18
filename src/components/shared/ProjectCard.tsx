import { Link } from '@tanstack/react-router'
import { useIntl } from '@/i18n'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/Project'
import { ProgressBar } from './ProgressBar'

export interface ChallengeMeta {
  totalChallenges: number
  pinned: number
  completed: number
}

interface ProjectCardProps {
  project: Project
  challengeMeta?: ChallengeMeta
  className?: string
  actions?: React.ReactNode
  linkTo?: string
  linkParams?: Record<string, string>
}

export const ProjectCard = ({
  project,
  challengeMeta,
  actions,
  className,
  linkTo,
  linkParams,
}: ProjectCardProps) => {
  const { t } = useIntl()
  const meta = challengeMeta ?? { totalChallenges: 0, pinned: 0, completed: 0 }
  const completionPercentage =
    meta.totalChallenges > 0 ? Math.round((meta.completed / meta.totalChallenges) * 100) : 0
  const lastUpdated = project.modified

  return (
    <Link
      to={linkTo ?? '/project/$projectId'}
      params={linkParams ?? { projectId: String(project.id) }}
      className={cn(
        'group relative block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:shadow-none dark:hover:brightness-110',
        className
      )}
    >
      {actions && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">{actions}</div>
      )}
      <div className="p-4">
        <div className="mb-2 text-xs text-zinc-500 dark:text-slate-300">
          {project.displayName || project.name}
        </div>

        <h3 className="mb-3 flex h-10 items-center font-semibold text-base text-zinc-900 leading-tight dark:text-white">
          <span className="line-clamp-2">{project.displayName || project.name}</span>
        </h3>

        <div>
          <div className="mb-1 text-xs text-zinc-500 dark:text-slate-300">
            <span className="font-semibold text-zinc-900 dark:text-white">
              {meta.totalChallenges - meta.completed} / {meta.totalChallenges}
            </span>{' '}
            {t('common.tasksRemaining2', undefined, 'tasks remaining')}
          </div>

          <ProgressBar percentage={completionPercentage} className="mb-3" />

          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-slate-300">
            <span className="flex items-center gap-3">
              <span>
                {t(
                  'shared.projectCard.totalChallenges',
                  { count: meta.totalChallenges },
                  'Total Challenges: {count}'
                )}
              </span>
              <span className="text-emerald-500">
                {t('shared.projectCard.completed', { count: meta.completed }, 'Completed: {count}')}
              </span>
              {meta.pinned > 0 && (
                <span className="text-yellow-500">
                  {t('shared.projectCard.pinned', { count: meta.pinned }, 'Pinned: {count}')}
                </span>
              )}
            </span>
            {lastUpdated ? (
              <span>
                {t(
                  'common.lastUpdated',
                  { date: formatDate(new Date(lastUpdated)) },
                  'Last updated {date}'
                )}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  )
}
