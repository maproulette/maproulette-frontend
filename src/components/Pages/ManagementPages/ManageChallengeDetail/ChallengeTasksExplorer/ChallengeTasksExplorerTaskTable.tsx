import { Link } from '@tanstack/react-router'
import { type RefObject, useMemo } from 'react'
import { TASK_STATUS_LABELS } from '@/components/Pages/ManagementPages/taskStatusLabels'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/Checkbox'
import {
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
import type { TaskMarker } from '@/types/Task'
import { useExplorerContext } from './ChallengeTasksExplorerContext'
import { TASK_PRIORITY_LABEL_IDS, TASK_PRIORITY_LABELS } from './constants'

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
  const { selectedTask, setSelectedTask } = useExplorerContext()

  const visibleIds = useMemo(() => visibleMarkers.map((m) => m.id), [visibleMarkers])
  const { allVisibleSelected, someVisibleSelected } = useMemo(() => {
    const selectedCount = visibleIds.filter((id) => rowSelection.has(id)).length
    return {
      allVisibleSelected: visibleIds.length > 0 && selectedCount === visibleIds.length,
      someVisibleSelected: selectedCount > 0,
    }
  }, [visibleIds, rowSelection])

  const statusLabel = (s: number) =>
    TASK_STATUS_LABELS[s] ?? t('common.statusWithStatus', { status: s }, 'Status {status}')
  const priorityLabel = (p: number) =>
    TASK_PRIORITY_LABEL_IDS[p]
      ? t(TASK_PRIORITY_LABEL_IDS[p], undefined, TASK_PRIORITY_LABELS[p])
      : String(p)

  return (
    <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border border-zinc-200 dark:border-slate-700">
      <Table>
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
                aria-label={t(
                  'manageChallengeDetail.tasksExplorer.selectAllVisibleLabel',
                  undefined,
                  'Select all visible tasks'
                )}
              />
            </TableHead>
            <TableHead className="w-[44px]" />
            <TableHead className="w-[88px]">{t('common.id', undefined, 'ID')}</TableHead>
            <TableHead className="w-[120px]">{t('common.status', undefined, 'Status')}</TableHead>
            <TableHead className="w-[100px]">
              {t('common.priority', undefined, 'Priority')}
            </TableHead>
            <TableHead className="w-[88px]">
              {t('manageChallengeDetail.tasksExplorer.columnBundle', undefined, 'Bundle')}
            </TableHead>
            <TableHead className="w-[140px] text-right">
              {t('common.actions', undefined, 'Actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {visibleMarkers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center text-zinc-500">
                {t(
                  'manageChallengeDetail.tasksExplorer.noTasksMatch',
                  undefined,
                  'No tasks match the current filters.'
                )}
              </TableCell>
            </TableRow>
          ) : (
            visibleMarkers.map((marker) => {
              const isSelected = selectedTask?.id === marker.id
              const isRowSelected = rowSelection.has(marker.id)
              return (
                <TableRow
                  key={marker.id}
                  className={isSelected ? 'bg-purple-50 dark:bg-purple-950/30' : undefined}
                >
                  <TableCell className="px-2">
                    <Checkbox
                      checked={isRowSelected}
                      onCheckedChange={(checked) => rowSelection.set(marker.id, checked === true)}
                      aria-label={
                        isRowSelected
                          ? t(
                              'manageChallengeDetail.tasksExplorer.deselectRowLabel',
                              undefined,
                              'Deselect row for bulk actions'
                            )
                          : t(
                              'manageChallengeDetail.tasksExplorer.selectRowLabel',
                              undefined,
                              'Select row for bulk actions'
                            )
                      }
                    />
                  </TableCell>
                  <TableCell className="px-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTask(isSelected ? null : marker)}
                      className="flex h-5 w-5 items-center justify-center"
                      aria-label={
                        isSelected
                          ? t(
                              'manageChallengeDetail.tasksExplorer.deselectTaskLabel',
                              undefined,
                              'Deselect task'
                            )
                          : t(
                              'manageChallengeDetail.tasksExplorer.selectTaskLabel',
                              undefined,
                              'Select task'
                            )
                      }
                    >
                      <span
                        className={cn(
                          'block h-3.5 w-3.5 rounded-full border-2 transition-colors',
                          isSelected
                            ? 'border-purple-500 bg-purple-500'
                            : 'border-zinc-400 dark:border-slate-600'
                        )}
                      >
                        {isSelected && (
                          <span className="block h-full w-full rounded-full border-2 border-white dark:border-slate-950" />
                        )}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{marker.id}</TableCell>
                  <TableCell className="text-sm">{statusLabel(marker.status)}</TableCell>
                  <TableCell className="text-sm">{priorityLabel(marker.priority)}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {marker.bundleId != null ? marker.bundleId : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
                        <Link to="/manage/task/$taskId" params={{ taskId: String(marker.id) }}>
                          {t('common.view', undefined, 'View')}
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 px-2" asChild>
                        <Link to="/manage/task/$taskId/edit" params={{ taskId: String(marker.id) }}>
                          {t('common.edit', undefined, 'Edit')}
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
