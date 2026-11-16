import { Link } from '@tanstack/react-router'
import { type RefObject, useMemo } from 'react'
import { TASK_STATUS_MESSAGES } from '@/components/Pages/ManagementPages/taskStatusLabels'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import {
  SortableTableHead,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table'
import type { UseRowSelectionReturn } from '@/hooks/useRowSelection'
import { useIntl } from '@/i18n'
import { cn } from '@/lib/utils'
import { isTaskPriority, PRIORITY_MESSAGES } from '@/types/Priority'
import type { TaskMarker } from '@/types/Task'
import { useExplorerContext } from './ChallengeTasksExplorerContext'
import type { SortField } from './constants'

/** Scrollable, infinitely-loading table of the currently filtered/sorted tasks. */
export const ChallengeTasksExplorerTaskTable = ({
  visibleMarkers,
  hasMore,
  sentinelRef,
  rowSelection,
}: {
  visibleMarkers: TaskMarker[]
  hasMore: boolean
  sentinelRef: RefObject<HTMLDivElement | null>
  rowSelection: UseRowSelectionReturn<number>
}) => {
  const { t } = useIntl()
  const { selectedTask, setSelectedTask, sortField, sortDesc, cycleSort } = useExplorerContext()
  const sortFor = (field: SortField) =>
    sortField === field ? (sortDesc ? 'desc' : 'asc') : (false as const)

  const visibleIds = useMemo(() => visibleMarkers.map((m) => m.id), [visibleMarkers])
  const { allVisibleSelected, someVisibleSelected } = useMemo(() => {
    const selectedCount = visibleIds.filter((id) => rowSelection.has(id)).length
    return {
      allVisibleSelected: visibleIds.length > 0 && selectedCount === visibleIds.length,
      someVisibleSelected: selectedCount > 0,
    }
  }, [visibleIds, rowSelection])

  const statusLabel = (s: number) =>
    (TASK_STATUS_MESSAGES[s] ? t(TASK_STATUS_MESSAGES[s]) : undefined) ??
    t({ id: 'common.statusWithStatus', defaultMessage: 'Status {status}' }, { status: s })
  const priorityLabel = (p: number) => (isTaskPriority(p) ? t(PRIORITY_MESSAGES[p]) : String(p))

  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 bg-white text-zinc-900 dark:border-slate-700 dark:bg-slate-900 dark:text-zinc-50">
      <Table density="compact">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[36px] px-2">
              <Checkbox
                checked={allVisibleSelected}
                indeterminate={someVisibleSelected && !allVisibleSelected}
                disabled={visibleIds.length === 0}
                onCheckedChange={(checked) => {
                  const next = new Set(rowSelection.ids)
                  for (const id of visibleIds) {
                    if (checked === true) {
                      next.add(id)
                    } else {
                      next.delete(id)
                    }
                  }
                  rowSelection.selectAll(Array.from(next))
                }}
                aria-label={t({
                  id: 'manageChallengeDetail.tasksExplorer.selectAllVisibleLabel',
                  defaultMessage: 'Select all visible tasks',
                })}
              />
            </TableHead>
            <SortableTableHead
              className="w-[88px]"
              sort={sortFor('id')}
              onSort={() => cycleSort('id')}
            >
              {t({ id: 'common.id', defaultMessage: 'ID' })}
            </SortableTableHead>
            <SortableTableHead
              className="w-[120px]"
              sort={sortFor('status')}
              onSort={() => cycleSort('status')}
            >
              {t({ id: 'common.status', defaultMessage: 'Status' })}
            </SortableTableHead>
            <SortableTableHead
              className="w-[100px]"
              sort={sortFor('priority')}
              onSort={() => cycleSort('priority')}
            >
              {t({ id: 'common.priority', defaultMessage: 'Priority' })}
            </SortableTableHead>
            <TableHead className="w-[88px]">
              {t({
                id: 'manageChallengeDetail.tasksExplorer.columnBundle',
                defaultMessage: 'Bundle',
              })}
            </TableHead>
            <TableHead className="w-[140px] text-right">
              {t({ id: 'common.actions', defaultMessage: 'Actions' })}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleMarkers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center text-zinc-500">
                {t({
                  id: 'manageChallengeDetail.tasksExplorer.noTasksMatch',
                  defaultMessage: 'No tasks match the current filters.',
                })}
              </TableCell>
            </TableRow>
          ) : (
            visibleMarkers.map((marker) => {
              const isSelected = selectedTask?.id === marker.id
              const isRowSelected = rowSelection.has(marker.id)
              const toggleSelected = () => setSelectedTask(isSelected ? null : marker)
              return (
                <TableRow
                  key={marker.id}
                  data-state={isRowSelected ? 'selected' : undefined}
                  className={cn(
                    'cursor-pointer',
                    isSelected &&
                      'bg-purple-50 data-[state=selected]:bg-purple-50 dark:bg-purple-950/30 dark:data-[state=selected]:bg-purple-950/30 [&>td:first-child]:shadow-[inset_3px_0_0_var(--color-purple-500)]'
                  )}
                  onClick={(e) => {
                    if ((e.target as HTMLElement).closest('a, button')) return
                    if (window.getSelection()?.toString()) return
                    toggleSelected()
                  }}
                >
                  <TableCell className="px-2">
                    <Checkbox
                      checked={isRowSelected}
                      onCheckedChange={(checked) => rowSelection.set(marker.id, checked === true)}
                      aria-label={
                        isRowSelected
                          ? t({
                              id: 'manageChallengeDetail.tasksExplorer.deselectRowLabel',
                              defaultMessage: 'Deselect row for bulk actions',
                            })
                          : t({
                              id: 'manageChallengeDetail.tasksExplorer.selectRowLabel',
                              defaultMessage: 'Select row for bulk actions',
                            })
                      }
                    />
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    <button
                      type="button"
                      onClick={toggleSelected}
                      aria-pressed={isSelected}
                      aria-label={t(
                        {
                          id: 'manageChallengeDetail.tasksExplorer.showTaskOnMapLabel',
                          defaultMessage: 'Show task {id} on map',
                        },
                        { id: marker.id }
                      )}
                      className="rounded-sm hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950/50 dark:focus-visible:ring-zinc-300/50"
                    >
                      {marker.id}
                    </button>
                  </TableCell>
                  <TableCell className="text-sm">{statusLabel(marker.status)}</TableCell>
                  <TableCell className="text-sm">{priorityLabel(marker.priority)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {marker.bundleId != null ? marker.bundleId : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                        <Link to="/tasks/$taskId" params={{ taskId: String(marker.id) }}>
                          {t({ id: 'common.view', defaultMessage: 'View' })}
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 px-2" asChild>
                        <Link to="/manage/task/$taskId/edit" params={{ taskId: String(marker.id) }}>
                          {t({ id: 'common.edit', defaultMessage: 'Edit' })}
                        </Link>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
      {/* Infinite scroll sentinel */}
      {hasMore && <div ref={sentinelRef} className="h-1" />}
    </div>
  )
}
