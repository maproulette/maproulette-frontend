import { ChallengeTasksMap } from '@/components/Map/ChallengeTasksMap'
import { useExplorerContext } from './ChallengeTasksExplorerContext'

/** Mini map showing the current (status/priority filtered) task markers. */
export const ChallengeTasksExplorerMapPanel = () => {
  const { mapMarkers, isLoading, setViewportBounds, selectedTask, setSelectedTask } =
    useExplorerContext()

  return (
    <div className="relative h-full">
      <ChallengeTasksMap
        markers={mapMarkers}
        isLoading={isLoading}
        showLegend={false}
        className="rounded-lg border border-zinc-200 dark:border-slate-700"
        onBoundsChange={setViewportBounds}
        selectedTask={selectedTask}
        onSelectTask={setSelectedTask}
      />
      <div className="-translate-x-1/2 -translate-y-1/2 pointer-events-none absolute top-1/2 left-0 z-20">
        <div className="flex h-14 w-4 items-center justify-center rounded-full bg-white shadow-md dark:bg-slate-200">
          <div className="grid grid-cols-2 gap-[3px]">
            <div className="h-1 w-1 rounded-full bg-zinc-500" />
            <div className="h-1 w-1 rounded-full bg-zinc-500" />
            <div className="h-1 w-1 rounded-full bg-zinc-500" />
            <div className="h-1 w-1 rounded-full bg-zinc-500" />
            <div className="h-1 w-1 rounded-full bg-zinc-500" />
            <div className="h-1 w-1 rounded-full bg-zinc-500" />
          </div>
        </div>
      </div>
    </div>
  )
}
