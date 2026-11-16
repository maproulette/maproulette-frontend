import { Link } from '@tanstack/react-router'
import { Lock, Package } from 'lucide-react'
import type { LockedTaskData } from '@/api/user/profile'
import { useIntl } from '@/i18n'
import { formatTimeAgo } from '@/lib/date'

interface LockedTasksBlockProps {
  lockedTasks: LockedTaskData[]
}

/**
 * Shows the tasks the current user currently has locked (work in progress), each
 * linking back to the task so they can pick up where they left off.
 */
export const LockedTasksBlock = ({ lockedTasks }: LockedTasksBlockProps) => {
  const { t, locale } = useIntl()

  if (lockedTasks.length === 0) return null

  return (
    <div className="mb-4">
      <h3 className="mb-2 flex items-center gap-1.5 font-medium text-xs text-zinc-600 dark:text-slate-400">
        <Lock className="size-3.5" />
        {t(
          {
            id: 'dashboard.activity.lockedTasks.title',
            defaultMessage: '{count, plural, one {# locked task} other {# locked tasks}}',
          },
          { count: lockedTasks.length }
        )}
      </h3>
      <div className="space-y-1.5">
        {lockedTasks.map((lockedTask) => (
          <div
            key={lockedTask.id}
            className="stretched-link-container rounded-lg border border-zinc-200 px-3 py-2 transition-colors hover:border-zinc-400 dark:border-slate-700 dark:hover:border-slate-500"
          >
            <Link
              to="/tasks/$taskId"
              params={{ taskId: String(lockedTask.id) }}
              className="stretched-link block truncate font-medium text-sm text-zinc-900 dark:text-slate-100"
            >
              {lockedTask.parentName}
            </Link>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-600 dark:text-slate-400">
              <span>
                {t(
                  {
                    id: 'common.taskWithId',
                    defaultMessage: 'Task #{id}',
                  },
                  { id: lockedTask.id }
                )}
              </span>
              {(lockedTask.bundledTasks?.length ?? 0) > 1 && (
                <span className="flex items-center gap-1">
                  <Package className="size-3" />
                  {t(
                    {
                      id: 'common.tasksWithCount',
                      defaultMessage: '{count, plural, one {# task} other {# tasks}}',
                    },
                    { count: lockedTask.bundledTasks?.length ?? 0 }
                  )}
                </span>
              )}
              {lockedTask.startedAt ? (
                <span className="ml-auto">
                  {formatTimeAgo(new Date(lockedTask.startedAt), locale)}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
