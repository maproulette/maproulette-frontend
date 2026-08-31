import { Link } from '@tanstack/react-router'
import { Lock, Package } from 'lucide-react'
import { api } from '@/api'
import { useIntl } from '@/i18n'
import { formatTimeAgo } from '@/lib/date'

interface LockedTasksBlockProps {
  userId: number
}

/**
 * Shows the tasks the current user currently has locked (work in progress), each
 * linking back to the task so they can pick up where they left off.
 */
export const LockedTasksBlock = ({ userId }: LockedTasksBlockProps) => {
  const { t } = useIntl()
  const { data: lockedTasks } = api.user.lockedTasks(userId)

  if (!lockedTasks || lockedTasks.length === 0) return null

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <Lock className="h-3.5 w-3.5 text-amber-500" />
        <span className="font-semibold text-xs text-zinc-600 dark:text-slate-300">
          {t('dashboard.contributions.lockedTasks.title', undefined, 'Locked tasks')}
        </span>
        <span className="ml-auto rounded-full bg-amber-500/20 px-2 py-0.5 font-medium text-amber-500 text-xs">
          {lockedTasks.length}
        </span>
      </div>
      <div className="space-y-1.5">
        {lockedTasks.map((lockedTask) => (
          <Link
            key={lockedTask.id}
            to="/tasks/$taskId"
            params={{ taskId: String(lockedTask.id) }}
            className="block rounded-lg border border-zinc-200 bg-white px-3 py-2 transition-colors hover:border-amber-400 dark:border-slate-700 dark:bg-slate-800 dark:hover:border-amber-500/60"
          >
            <div className="flex items-center gap-1.5 font-medium text-emerald-400 text-sm">
              <span className="truncate">{lockedTask.parentName}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-slate-400">
              <span>
                {t(
                  'dashboard.contributions.lockedTasks.taskId',
                  { id: lockedTask.id },
                  'Task #{id}'
                )}
              </span>
              {lockedTask.bundledTasks.length > 1 && (
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {t(
                    'dashboard.contributions.lockedTasks.bundleCount',
                    { count: lockedTask.bundledTasks.length },
                    '{count} tasks'
                  )}
                </span>
              )}
              {lockedTask.startedAt ? (
                <span className="ml-auto">{formatTimeAgo(new Date(lockedTask.startedAt))}</span>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
