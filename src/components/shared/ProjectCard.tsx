import { Link } from '@tanstack/react-router'
import { useIntl } from '@/i18n'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/Project'
import { ProgressBar } from './ProgressBar'
import { SidebarIndicator } from './SidebarIndicator'

export interface ChallengeMeta {
  totalTasks: number
  completed: number
}

interface ProjectCardProps {
  project: Project
  challengeMeta?: ChallengeMeta
  totalChallenges?: number
  completedChallenges?: number
  className?: string
  actions?: React.ReactNode
  linkTo?: string
  linkParams?: Record<string, string>
  onSelect?: () => void
  selected?: boolean
}

export const ProjectCard = ({
  project,
  challengeMeta,
  totalChallenges,
  completedChallenges,
  actions,
  className,
  linkTo,
  linkParams,
  onSelect,
  selected = false,
}: ProjectCardProps) => {
  const { t, locale } = useIntl()
  const completionPercentage =
    challengeMeta && challengeMeta.totalTasks > 0
      ? Math.round((challengeMeta.completed / challengeMeta.totalTasks) * 100)
      : undefined
  const lastUpdated = project.modified
  const cardClassName = cn(
    'group stretched-link-container block overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:shadow-none dark:hover:brightness-110',
    selected && 'ring-2 ring-blue-500 dark:ring-blue-400',
    className
  )

  const title = project.displayName || project.name
  const titleTarget = onSelect ? (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className="stretched-link cursor-pointer text-left"
    >
      {title}
    </button>
  ) : (
    <Link
      to={linkTo ?? '/project/$projectId'}
      params={linkParams ?? { projectId: String(project.id) }}
      className="stretched-link"
    >
      {title}
    </Link>
  )

  return (
    <div className={cardClassName}>
      <div className="p-4">
        <div className="flex items-center justify-between pb-2">
          <h3 className="flex items-center font-semibold text-base text-zinc-900 leading-tight dark:text-white">
            <span className="line-clamp-2">{titleTarget}</span>
          </h3>
          <div className="flex items-center gap-2">
            {actions && <div className="relative z-10 flex items-center gap-1">{actions}</div>}
            <SidebarIndicator
              avatarUrl={project.avatarUrl}
              className="relative top-auto right-auto shrink-0"
            />
          </div>
        </div>

        <div>
          {challengeMeta ? (
            <div className="mb-1 text-xs text-zinc-500 dark:text-slate-300">
              <span className="font-semibold text-zinc-900 dark:text-white">
                {challengeMeta.totalTasks - challengeMeta.completed} / {challengeMeta.totalTasks}
              </span>{' '}
              {t({ id: 'common.tasksRemaining2', defaultMessage: 'tasks remaining' })}
            </div>
          ) : null}
          <ProgressBar percentage={completionPercentage} className="mb-3" />
          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-slate-300">
            <span className="flex items-center gap-3">
              <span>
                {totalChallenges
                  ? t(
                      {
                        id: 'shared.projectCard.totalChallenges',
                        defaultMessage: 'Total Challenges: {count}',
                      },
                      { count: totalChallenges }
                    )
                  : null}
              </span>
              <span className="text-emerald-500">
                {completedChallenges
                  ? t(
                      { id: 'shared.projectCard.completed', defaultMessage: 'Completed: {count}' },
                      { count: completedChallenges }
                    )
                  : null}
              </span>
            </span>
            {lastUpdated ? (
              <span>
                {t(
                  { id: 'common.lastUpdated', defaultMessage: 'Last updated {date}' },
                  { date: formatDate(new Date(lastUpdated), locale) }
                )}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
