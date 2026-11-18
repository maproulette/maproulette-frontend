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
  const { enabled, filteredMarkers } = useExplorerContext()

  const { visibleMarkers, hasMore, sentinelRef } = useVisibleTaskMarkers(filteredMarkers)
  const { topRef, showScrollTop, scrollToTop } = useScrollToTopVisibility()
  const rowSelection = useRowSelection<number>()

  if (!enabled) {
    return null
  }

  return (
    <div className="relative flex h-full flex-col">
      <div ref={topRef} />
      <div className="shrink-0 pb-2">
        <ChallengeTasksExplorerControls />
      </div>
      <ResizablePanelGroup
        direction="vertical"
        className="h-auto min-h-0 flex-1"
        style={{ overflow: 'visible' }}
      >
        <ResizablePanel defaultSize={50} minSize={20} style={{ overflow: 'visible' }}>
          <ChallengeTasksExplorerMapPanel />
        </ResizablePanel>

        {/* The default vertical handle has zero net height; this gives it an
            8px gutter to match the gap under the filter bar. */}
        <ResizableHandle
          withHandle
          className="data-[panel-group-direction=vertical]:my-0 data-[panel-group-direction=vertical]:h-2"
        />

        <ResizablePanel defaultSize={50} minSize={15}>
          <div className="flex h-full flex-col">
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
          className="fixed right-6 bottom-6 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-fg shadow-xl transition-opacity hover:bg-primary-hover"
          aria-label={t({ id: 'common.scrollToTop', defaultMessage: 'Scroll to top' })}
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}
    </div>
  )
}
