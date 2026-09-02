import { ArrowDownAZ, ArrowUpAZ, ChevronDown, X } from 'lucide-react'
import { TASK_STATUS_LABELS } from '@/components/Pages/ManagementPages/taskStatusLabels'
import { Button } from '@/components/ui/Button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import { useIntl } from '@/i18n'
import { DEFAULT_PRIORITY_FILTER, DEFAULT_TASK_STATUS_FILTER } from '@/lib/challengeTaskTableSearch'
import { cn } from '@/lib/utils'
import { useExplorerContext } from './ChallengeTasksExplorerContext'
import {
  SORT_FIELD_LABEL_IDS,
  SORT_FIELDS,
  type SortField,
  TASK_PRIORITY_LABEL_IDS,
  TASK_PRIORITY_LABELS,
} from './constants'
import { PropertyFilterButton } from './PropertyFilterButton'

/** Horizontal filter & sort controls rendered above the task table. */
export const ChallengeTasksExplorerControls = ({ countLabel }: { countLabel: string }) => {
  const { t } = useIntl()
  const {
    enabled,
    statusEnabled,
    setStatusChecked,
    priorityEnabled,
    setPriorityChecked,
    sortField,
    setSortField,
    sortDesc,
    setSortDesc,
    clearFilters,
    filtersDirty,
  } = useExplorerContext()

  if (!enabled) {
    return null
  }

  const statusDirty = DEFAULT_TASK_STATUS_FILTER.some((s) => !statusEnabled[s])
  const priorityDirty = DEFAULT_PRIORITY_FILTER.some((p) => !priorityEnabled[p])

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white p-2 shadow-xs dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap font-medium text-sm text-zinc-700 dark:text-zinc-300">
          {t('manageChallengeDetail.tasksExplorer.filtersLabel', undefined, 'Filters')}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 w-32 justify-between gap-1 font-normal',
                statusDirty &&
                  'border-emerald-500 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
              )}
            >
              <span>
                {t('common.status', undefined, 'Status')}
                {statusDirty ? ' •' : ''}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="max-h-72 w-56 overflow-y-auto" align="start">
            <DropdownMenuLabel>
              {t(
                'manageChallengeDetail.tasksExplorer.taskStatusMenuLabel',
                undefined,
                'Task status'
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DEFAULT_TASK_STATUS_FILTER.map((s) => (
              <DropdownMenuCheckboxItem
                key={s}
                checked={statusEnabled[s]}
                onCheckedChange={(c) => setStatusChecked(s, c === true)}
                onSelect={(e) => e.preventDefault()}
              >
                {TASK_STATUS_LABELS[s]}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                'h-9 w-32 justify-between gap-1 font-normal',
                priorityDirty &&
                  'border-emerald-500 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
              )}
            >
              <span>
                {t('common.priority', undefined, 'Priority')}
                {priorityDirty ? ' •' : ''}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>{t('common.priority', undefined, 'Priority')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DEFAULT_PRIORITY_FILTER.map((p) => (
              <DropdownMenuCheckboxItem
                key={p}
                checked={priorityEnabled[p]}
                onCheckedChange={(c) => setPriorityChecked(p, c === true)}
                onSelect={(e) => e.preventDefault()}
              >
                {t(TASK_PRIORITY_LABEL_IDS[p], undefined, TASK_PRIORITY_LABELS[p])}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <PropertyFilterButton />

        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 gap-1 text-zinc-600 hover:text-zinc-900 disabled:opacity-40 dark:text-zinc-400 dark:hover:text-zinc-100"
          disabled={!filtersDirty}
          onClick={clearFilters}
          title={t(
            'manageChallengeDetail.tasksExplorer.clearFiltersTitle',
            undefined,
            'Clear all filters and reset sort'
          )}
        >
          <X className="h-4 w-4" />
          {t('common.clear', undefined, 'Clear')}
        </Button>
      </div>

      <div className="h-6 w-px bg-zinc-200 dark:bg-slate-700" />

      <div className="flex items-center gap-2">
        <span className="whitespace-nowrap font-medium text-sm text-zinc-700 dark:text-zinc-300">
          {t('manageChallengeDetail.tasksExplorer.sortLabel', undefined, 'Sort')}
        </span>
        <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
          <SelectTrigger size="sm" className="h-9 w-28">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_FIELDS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(SORT_FIELD_LABEL_IDS[opt.value], undefined, opt.label)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 gap-1 font-normal"
          onClick={() => setSortDesc((d) => !d)}
          title={
            sortDesc
              ? t(
                  'manageChallengeDetail.tasksExplorer.sortDescTitle',
                  undefined,
                  'Descending — click for ascending'
                )
              : t(
                  'manageChallengeDetail.tasksExplorer.sortAscTitle',
                  undefined,
                  'Ascending — click for descending'
                )
          }
        >
          {sortDesc ? (
            <>
              <ArrowDownAZ className="h-4 w-4" />
              {t('manageChallengeDetail.tasksExplorer.sortDescButton', undefined, 'Desc')}
            </>
          ) : (
            <>
              <ArrowUpAZ className="h-4 w-4" />
              {t('manageChallengeDetail.tasksExplorer.sortAscButton', undefined, 'Asc')}
            </>
          )}
        </Button>
      </div>

      <div className="ml-auto whitespace-nowrap text-sm text-zinc-600 dark:text-zinc-400">
        {countLabel}
      </div>
    </div>
  )
}
