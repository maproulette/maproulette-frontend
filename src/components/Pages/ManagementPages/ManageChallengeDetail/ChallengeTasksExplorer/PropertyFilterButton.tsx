import { ChevronDown, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { DocsLink } from '@/components/shared/DocsLink'
import { TaskPropertyQueryBuilder } from '@/components/shared/TaskPropertyQueryBuilder'
import type { BinaryNode } from '@/components/shared/TaskPropertyQueryBuilder/propertyRuleTypes'
import { searchableOperators } from '@/components/shared/TaskPropertyQueryBuilder/taskPropertySearch'
import { Button } from '@/components/ui/Button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { useExplorerContext } from './ChallengeTasksExplorerContext'

/**
 * "Filter by property" control for the task table: the same AND/OR rule builder
 * used by task prioritization, applied to the challenge's feature properties.
 */
export const PropertyFilterButton = () => {
  const { t } = useIntl()
  const { propertyRule, setPropertyRule, propertyFilterActive, propertyMatchesLoading } =
    useExplorerContext()
  const [open, setOpen] = useState(false)
  // Held while the manager edits, and only applied on Apply, so the table
  // doesn't refetch on every keystroke in the rule builder.
  const [draft, setDraft] = useState<BinaryNode | null>(propertyRule)

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (next) setDraft(propertyRule)
        setOpen(next)
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 justify-between gap-1 font-normal',
            propertyFilterActive &&
              'border-emerald-500 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
          )}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0 opacity-60" />
          <span>
            {t(
              'manageChallengeDetail.tasksExplorer.propertyFilterLabel',
              undefined,
              'Filter by property'
            )}
            {propertyFilterActive ? ' •' : ''}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[32rem] max-w-[90vw] space-y-3">
        <div>
          <p className="font-medium text-sm text-zinc-900 dark:text-zinc-50">
            {t(
              'manageChallengeDetail.tasksExplorer.propertyFilterTitle',
              undefined,
              'Filter tasks by feature property'
            )}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {t(
              'manageChallengeDetail.tasksExplorer.propertyFilterHelp',
              undefined,
              'Combine property comparisons with AND/OR. Tasks matching the rule are shown in the table and on the map.'
            )}{' '}
            <DocsLink page="filteringTasksByProperties" icon={null}>
              {t(
                'manageChallengeDetail.tasksExplorer.propertyFilterDocsLink',
                undefined,
                'Learn more'
              )}
            </DocsLink>
          </p>
        </div>

        <TaskPropertyQueryBuilder
          value={propertyRule}
          onChange={setDraft}
          operatorsFor={searchableOperators}
        />

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={!propertyFilterActive}
            onClick={() => {
              setDraft(null)
              setPropertyRule(null)
              setOpen(false)
            }}
          >
            {t('common.clear', undefined, 'Clear')}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={propertyMatchesLoading}
            onClick={() => {
              setPropertyRule(draft)
              setOpen(false)
            }}
          >
            {t('manageChallengeDetail.tasksExplorer.propertyFilterApply', undefined, 'Apply')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
