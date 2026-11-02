import { Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useIntl } from '@/i18n'
import { formatDate } from '@/lib/date'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/Project'
import { ProgressBar } from './ProgressBar'
import { SidebarIndicator } from './SidebarIndicator'

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
  onSelect?: () => void
  selected?: boolean
}

export const ProjectCard = ({
  project,
  challengeMeta,
  actions,
  className,
  linkTo,
  linkParams,
  onSelect,
  selected = false,
}: ProjectCardProps) => {
  const { t, locale } = useIntl()
  // The image belongs to the team managing the project and is addressed by that
  // team, so a project can carry a url and still have nothing to show when the
  // team has no approved image. Space for it is only reserved while it renders.
  const [imageFailed, setImageFailed] = useState(false)
  useEffect(() => setImageFailed(false), [project.avatarUrl])
  const showsImage = !!project.avatarUrl && !imageFailed
  const meta = challengeMeta ?? { totalChallenges: 0, pinned: 0, completed: 0 }
  const completionPercentage =
    meta.totalChallenges > 0 ? Math.round((meta.completed / meta.totalChallenges) * 100) : 0
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
      {actions && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1">{actions}</div>
      )}
      <SidebarIndicator avatarUrl={project.avatarUrl} onLoadFailure={() => setImageFailed(true)} />
      <div className="p-4">
        <div
          className={cn('mb-2 text-xs text-zinc-500 dark:text-slate-300', showsImage && 'mr-16')}
        >
          {title}
        </div>

        <h3
          className={cn(
            'mb-3 flex h-10 items-center font-semibold text-base text-zinc-900 leading-tight dark:text-white',
            showsImage && 'mr-16'
          )}
        >
          <span className="line-clamp-2">{titleTarget}</span>
        </h3>

        <div>
          <div className="mb-1 text-xs text-zinc-500 dark:text-slate-300">
            <span className="font-semibold text-zinc-900 dark:text-white">
              {meta.totalChallenges - meta.completed} / {meta.totalChallenges}
            </span>{' '}
            {t({
              id: 'shared.projectCard.challengesRemaining',
              defaultMessage: 'challenges remaining',
            })}
          </div>

          <ProgressBar percentage={completionPercentage} className="mb-3" />

          <div className="flex items-center justify-between gap-3 text-xs text-zinc-500 dark:text-slate-300">
            <span className="flex items-center gap-3">
              <span>
                {t(
                  {
                    id: 'shared.projectCard.totalChallenges',
                    defaultMessage: 'Total Challenges: {count}',
                  },
                  { count: meta.totalChallenges }
                )}
              </span>
              <span className="text-emerald-500">
                {t(
                  { id: 'shared.projectCard.completed', defaultMessage: 'Completed: {count}' },
                  { count: meta.completed }
                )}
              </span>
              {meta.pinned > 0 && (
                <span className="text-yellow-500">
                  {t(
                    { id: 'shared.projectCard.pinned', defaultMessage: 'Pinned: {count}' },
                    { count: meta.pinned }
                  )}
                </span>
              )}
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
