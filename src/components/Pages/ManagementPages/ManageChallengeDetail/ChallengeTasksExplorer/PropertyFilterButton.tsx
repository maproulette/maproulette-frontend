import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/api'
import { DocsLink } from '@/components/shared/DocsLink'
import { TaskPropertyQueryBuilder } from '@/components/shared/TaskPropertyQueryBuilder'
import type { BinaryNode } from '@/components/shared/TaskPropertyQueryBuilder/propertyRuleTypes'
import { searchableOperators } from '@/components/shared/TaskPropertyQueryBuilder/taskPropertySearch'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { useExplorerContext } from './ChallengeTasksExplorerContext'

/**
 * "Filter by property" control for the task table: the same AND/OR rule builder
 * used by task prioritization, applied to the challenge's feature properties.
 */
export const PropertyFilterButton = () => {
  const { t } = useIntl()
  const {
    challengeId,
    propertyRule,
    setPropertyRule,
    propertyFilterActive,
    propertyMatchesLoading,
  } = useExplorerContext()
  const [open, setOpen] = useState(false)
  // Only sampled once the manager actually opens the filter.
  const { data: propertyKeys } = api.task.getChallengePropertyKeys(challengeId, { enabled: open })
  // Held while the manager edits, and only applied on Apply, so the table
  // doesn't refetch on every keystroke in the rule builder.
  const [draft, setDraft] = useState<BinaryNode | null>(propertyRule)

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'h-9 gap-1 font-normal',
          propertyFilterActive &&
            'border-emerald-500 text-emerald-700 dark:border-emerald-400 dark:text-emerald-300'
        )}
        onClick={() => {
          setDraft(propertyRule)
          setOpen(true)
        }}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0 opacity-60" />
        <span>
          {t({
            id: 'manageChallengeDetail.tasksExplorer.propertyFilterLabel',
            defaultMessage: 'Filter by property',
          })}
          {propertyFilterActive ? ' •' : ''}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent size="xl">
          <DialogHeader>
            <DialogTitle>
              {t({
                id: 'manageChallengeDetail.tasksExplorer.propertyFilterTitle',
                defaultMessage: 'Filter tasks by feature property',
              })}
            </DialogTitle>
            <DialogDescription>
              {t({
                id: 'manageChallengeDetail.tasksExplorer.propertyFilterHelp',
                defaultMessage:
                  'Combine property comparisons with AND/OR. Tasks matching the rule are shown in the table and on the map.',
              })}{' '}
              <DocsLink page="filteringTasksByProperties" icon={null}>
                {t({
                  id: 'manageChallengeDetail.tasksExplorer.propertyFilterDocsLink',
                  defaultMessage: 'Learn more',
                })}
              </DocsLink>
            </DialogDescription>
          </DialogHeader>

          <TaskPropertyQueryBuilder
            value={propertyRule}
            onChange={setDraft}
            operatorsFor={searchableOperators}
            propertyKeys={propertyKeys}
          />

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={!propertyFilterActive}
              onClick={() => {
                setDraft(null)
                setPropertyRule(null)
                setOpen(false)
              }}
            >
              {t({ id: 'common.clear', defaultMessage: 'Clear' })}
            </Button>
            <Button
              type="button"
              disabled={propertyMatchesLoading || !draft}
              onClick={() => {
                setPropertyRule(draft)
                setOpen(false)
              }}
            >
              {t({ id: 'common.apply', defaultMessage: 'Apply' })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
