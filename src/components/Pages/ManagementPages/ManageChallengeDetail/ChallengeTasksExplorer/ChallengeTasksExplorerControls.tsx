import { ChevronDown, X } from 'lucide-react'
import { TASK_STATUS_MESSAGES } from '@/components/Pages/ManagementPages/taskStatusLabels'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import { useIntl } from '@/i18n'
import { DEFAULT_PRIORITY_FILTER, DEFAULT_TASK_STATUS_FILTER } from '@/lib/challengeTaskTableSearch'
import { cn } from '@/lib/utils'
import { PRIORITY_MESSAGES } from '@/types/Priority'
import { useExplorerContext } from './ChallengeTasksExplorerContext'
import { ExportTasksButton } from './ExportTasksButton'
import { PropertyFilterButton } from './PropertyFilterButton'

/** Filter controls for both the map and the task table, with the matching task count. */
export const ChallengeTasksExplorerControls = () => {
  const { t } = useIntl()
  const {
    enabled,
    statusEnabled,
    setStatusChecked,
    priorityEnabled,
    setPriorityChecked,
    clearFilters,
    filtersDirty,
    markers,
    filteredMarkers,
    isLoading,
  } = useExplorerContext()

  if (!enabled) {
    return null
  }

  const statusDirty = DEFAULT_TASK_STATUS_FILTER.some((s) => !statusEnabled[s])
  const priorityDirty = DEFAULT_PRIORITY_FILTER.some((p) => !priorityEnabled[p])

  return (
    <fieldset
      aria-label={t({
        id: 'manageChallengeDetail.tasksExplorer.filterBarLabel',
        defaultMessage: 'Task filters',
      })}
      className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-line bg-card p-2"
    >
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap font-medium text-fg text-sm">
          {t({ id: 'manageChallengeDetail.tasksExplorer.filtersLabel', defaultMessage: 'Filters' })}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-32 justify-between gap-1 font-normal',
                statusDirty && 'border-accent text-link'
              )}
            >
              <span>
                {t({ id: 'common.status', defaultMessage: 'Status' })}
                {statusDirty ? ' •' : ''}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-72 w-56 overflow-y-auto" align="start">
            <DropdownMenuLabel>
              {t({
                id: 'manageChallengeDetail.tasksExplorer.taskStatusMenuLabel',
                defaultMessage: 'Task status',
              })}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DEFAULT_TASK_STATUS_FILTER.map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={statusEnabled[s]}
                onCheckedChange={(c) => setStatusChecked(s, c === true)}
                onSelect={(e) => e.preventDefault()}
              >
                {t(TASK_STATUS_MESSAGES[s])}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-32 justify-between gap-1 font-normal',
                priorityDirty && 'border-accent text-link'
              )}
            >
              <span>
                {t({ id: 'common.priority', defaultMessage: 'Priority' })}
                {priorityDirty ? ' •' : ''}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>
              {t({ id: 'common.priority', defaultMessage: 'Priority' })}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DEFAULT_PRIORITY_FILTER.map((p) => (
              <DropdownMenuCheckboxItem
                key={p}
                checked={priorityEnabled[p]}
                onCheckedChange={(c) => setPriorityChecked(p, c === true)}
                onSelect={(e) => e.preventDefault()}
              >
                {t(PRIORITY_MESSAGES[p])}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <PropertyFilterButton />

        <Button
          type="button"
          variant="ghost"
          className="gap-1 text-fg-muted hover:text-fg disabled:opacity-40"
          disabled={!filtersDirty}
          onClick={clearFilters}
          title={t({
            id: 'manageChallengeDetail.tasksExplorer.clearAllFiltersTitle',
            defaultMessage: 'Clear all filters',
          })}
        >
          <X className="h-4 w-4" />
          {t({ id: 'common.clear', defaultMessage: 'Clear' })}
        </Button>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <span className="whitespace-nowrap text-fg-muted text-sm">
          {isLoading
            ? t({
                id: 'manageChallengeDetail.tasksExplorer.loadingTasks',
                defaultMessage: 'Loading tasks…',
              })
            : t(
                {
                  id: 'manageChallengeDetail.tasksExplorer.showingCount',
                  defaultMessage:
                    '{total, plural, one {Showing {shown, number} of # task} other {Showing {shown, number} of # tasks}}',
                },
                { shown: filteredMarkers.length, total: markers.length }
              )}
        </span>
        <ExportTasksButton />
      </div>
    </fieldset>
  )
}
