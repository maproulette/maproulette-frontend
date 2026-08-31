import { ArrowUp } from 'lucide-react'
import { BulkActionsToolbar } from '@/components/Pages/ManagementPages/shared/BulkActionsToolbar'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable'
import { useRowSelection } from '@/hooks/useRowSelection'
import { useIntl } from '@/i18n'
import { useExplorerContext } from './ChallengeTasksExplorerContext'
import { ChallengeTasksExplorerControls } from './ChallengeTasksExplorerControls'
import { ChallengeTasksExplorerMapPanel } from './ChallengeTasksExplorerMapPanel'
import { ChallengeTasksExplorerTaskTable } from './ChallengeTasksExplorerTaskTable'
import { useScrollToTopVisibility } from './useScrollToTopVisibility'
import { useVisibleTaskMarkers } from './useVisibleTaskMarkers'

/** Map and infinite-scroll task table. */
export const ChallengeTasksExplorerMain = () => {
  const { t } = useIntl()
  const { enabled, filteredMarkers, isLoading } = useExplorerContext()

  const { visibleMarkers, hasMore, sentinelRef } = useVisibleTaskMarkers(filteredMarkers)
  const { topRef, showScrollTop, scrollToTop } = useScrollToTopVisibility()
  const rowSelection = useRowSelection<number>()

  if (!enabled) {
    return null
  }

  return (
    <div className="relative h-full">
      <div ref={topRef} />
      <ResizablePanelGroup direction="vertical" className="h-full" style={{ overflow: 'visible' }}>
        <ResizablePanel defaultSize={50} minSize={20} style={{ overflow: 'visible' }}>
          <ChallengeTasksExplorerMapPanel />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={50} minSize={15}>
          <div className="flex h-full flex-col">
            <div className="shrink-0 pb-2">
              <ChallengeTasksExplorerControls
                countLabel={
                  isLoading
                    ? t(
                        'manageChallengeDetail.tasksExplorer.loadingTasks',
                        undefined,
                        'Loading tasks…'
                      )
                    : t(
                        'manageChallengeDetail.tasksExplorer.showingCount',
                        { shown: visibleMarkers.length, total: filteredMarkers.length },
                        'Showing {shown} of {total} tasks'
                      )
                }
              />
            </div>

            <ChallengeTasksExplorerTaskTable
              visibleMarkers={visibleMarkers}
              hasMore={hasMore}
              sentinelRef={sentinelRef}
              rowSelection={rowSelection}
            />

            {rowSelection.count > 0 && (
              <div className="shrink-0 pt-2">
                <BulkActionsToolbar
                  selectedIds={rowSelection.idList}
                  onClearSelection={rowSelection.clear}
                />
              </div>
            )}
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Scroll to top button */}
      {showScrollTop && (
        <button
          type="button"
          onClick={scrollToTop}
          className="fixed right-6 bottom-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 text-white shadow-xl transition-opacity hover:bg-zinc-700 dark:bg-slate-200 dark:text-zinc-900 dark:hover:bg-slate-300"
          aria-label={t('common.scrollToTop', undefined, 'Scroll to top')}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
