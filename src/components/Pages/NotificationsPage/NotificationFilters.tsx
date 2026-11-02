import { Button } from '@/components/ui/Button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useNotificationsPageContext } from '@/contexts/NotificationsPageContext'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import {
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_STATUS_LABELS,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPE_NAMES,
  type NotificationCategory,
  type NotificationStatus,
} from '@/types/Notification'
import { SavedViewsMenu } from './SavedViewsMenu'

type PillProps = {
  label: string
  count: number
  active: boolean
  onClick: () => void
  variant?: 'category' | 'status'
}

const Pill = ({ label, count, active, onClick, variant = 'category' }: PillProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={cn(
      'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 font-medium text-sm transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/50 dark:focus-visible:ring-zinc-300/50',
      active
        ? variant === 'status'
          ? 'border-blue-600 bg-blue-600 text-white hover:bg-blue-500 dark:border-blue-500 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500'
          : 'border-zinc-900 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:border-slate-50 dark:bg-slate-50 dark:text-zinc-900 dark:hover:bg-slate-200'
        : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
    )}
  >
    <span>{label}</span>
    <span
      className={cn(
        'inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs',
        active
          ? variant === 'status'
            ? 'bg-blue-700/40 text-white dark:bg-blue-900/60'
            : 'bg-zinc-700 text-zinc-50 dark:bg-slate-300 dark:text-zinc-900'
          : 'bg-zinc-100 text-zinc-700 dark:bg-slate-700 dark:text-slate-200'
      )}
    >
      {count}
    </span>
  </button>
)

export const NotificationFilters = () => {
  const { t } = useIntl()
  const {
    filters: {
      category,
      setCategory,
      status,
      setStatus,
      filterTask,
      setFilterTask,
      filterType,
      setFilterType,
      filterFrom,
      setFilterFrom,
      filterChallenge,
      setFilterChallenge,
      hasActiveFilters,
      clearFilters,
      filterOptions,
      categoryCounts,
      statusCounts,
    },
  } = useNotificationsPageContext()

  return (
    <div className="mb-6 space-y-3">
      {/* Status + Category pills */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {NOTIFICATION_STATUSES.map((s: NotificationStatus) => (
            <Pill
              key={`status-${s}`}
              label={NOTIFICATION_STATUS_LABELS[s]}
              count={statusCounts[s]}
              active={status === s}
              onClick={() => setStatus(s)}
              variant="status"
            />
          ))}
          <span className="mx-1 self-center text-zinc-300 dark:text-slate-600" aria-hidden="true">
            |
          </span>
          {NOTIFICATION_CATEGORIES.map((c: NotificationCategory) => (
            <Pill
              key={`category-${c}`}
              label={NOTIFICATION_CATEGORY_LABELS[c]}
              count={categoryCounts[c]}
              active={category === c}
              onClick={() => setCategory(c)}
            />
          ))}
        </div>
        <div className="ml-auto">
          <SavedViewsMenu />
        </div>
      </div>

      {/* Secondary filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={filterTask} onValueChange={setFilterTask}>
          <SelectTrigger className="h-9 w-36">
            <SelectValue placeholder={t({ id: 'common.task', defaultMessage: 'Task' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t({ id: 'notificationsPage.filters.allTasks', defaultMessage: 'All Tasks' })}
            </SelectItem>
            {filterOptions.tasks.map((taskId: number) => (
              <SelectItem key={taskId} value={taskId.toString()}>
                {t({ id: 'common.taskWithTaskId', defaultMessage: 'Task #{taskId}' }, { taskId })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue placeholder={t({ id: 'common.type', defaultMessage: 'Type' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t({ id: 'notificationsPage.filters.allTypes', defaultMessage: 'All Types' })}
            </SelectItem>
            {filterOptions.types.map((typeId: number) => (
              <SelectItem key={typeId} value={typeId.toString()}>
                {NOTIFICATION_TYPE_NAMES[typeId] ||
                  t({ id: 'notificationsPage.filters.typeOptionFallback', defaultMessage: 'Type {typeId}' }, { typeId })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterFrom} onValueChange={setFilterFrom}>
          <SelectTrigger className="h-9 w-40">
            <SelectValue
              placeholder={t({ id: 'notificationsPage.filters.fromPlaceholder', defaultMessage: 'From' })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t({ id: 'notificationsPage.filters.allSenders', defaultMessage: 'All Senders' })}
            </SelectItem>
            {filterOptions.fromUsers.map((username: string) => (
              <SelectItem key={username} value={username}>
                {username}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterChallenge} onValueChange={setFilterChallenge}>
          <SelectTrigger className="h-9 w-44">
            <SelectValue placeholder={t({ id: 'common.challenge', defaultMessage: 'Challenge' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t({ id: 'common.allChallenges', defaultMessage: 'All Challenges' })}
            </SelectItem>
            {filterOptions.challenges.map((challengeName: string) => (
              <SelectItem key={challengeName} value={challengeName}>
                {challengeName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950/20 dark:hover:text-red-300"
            onClick={clearFilters}
          >
            {t({ id: 'notificationsPage.filters.clearFilters', defaultMessage: 'Clear Filters' })}
          </Button>
        )}
      </div>
    </div>
  )
}
