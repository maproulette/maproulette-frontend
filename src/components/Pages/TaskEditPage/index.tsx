import { useLoaderData } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { TaskMap } from '@/components/Pages/TaskEditPage/TaskMap'
import {
  DrawerPortalProvider,
  DrawerPortalTarget,
} from '@/components/TaskInfoPanel/DrawerPortalContext'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable'
import { useSetPageTitle } from '@/contexts/ChromeContext'
import { useIsDesktopLayoutContext } from '@/contexts/LayoutContext'
import { MapToggleContext } from '@/contexts/MapToggleContext'
import { EditorProvider, useEditorContext } from './contexts/EditorContext'
import { useTaskBundleContext } from './contexts/TaskBundleContext'
import { useTaskContext } from './contexts/TaskContext'
import { IdEditorView } from './IdEditorView'
import { TaskProviders } from './TaskLayout'
import { TaskPanel } from './TaskPanel'

const viewPanelClass = (isActive: boolean) =>
  isActive ? 'absolute inset-0' : 'invisible absolute inset-0 pointer-events-none'

const TaskContent = () => {
  const { activeView, idEditorMounted, showMap } = useEditorContext()
  const { task } = useTaskContext()
  const { drawerOpen } = useTaskBundleContext()
  const isDesktop = useIsDesktopLayoutContext()
  const [mapOpen, setMapOpen] = useState(false)
  const mapToggleValue = useMemo(() => ({ showMap: mapOpen, setShowMap: setMapOpen }), [mapOpen])

  useEffect(() => {
    if (drawerOpen) setMapOpen(false)
  }, [drawerOpen])

  const viewer = (
    <>
      <div className={viewPanelClass(activeView === 'map')}>
        <TaskMap />
      </div>
      {idEditorMounted && (
        <div className={viewPanelClass(activeView === 'id')}>
          <IdEditorView onClose={showMap} />
        </div>
      )}
    </>
  )

  if (!isDesktop) {
    const showViewer = mapOpen || activeView === 'id'
    return (
      <MapToggleContext.Provider value={mapToggleValue}>
        <DrawerPortalProvider>
          <div className="relative h-full overflow-hidden px-4">
            <div className={showViewer ? 'hidden' : 'relative h-full overflow-hidden'}>
              <TaskPanel key={task.id} />
            </div>
            <div
              className={
                showViewer
                  ? 'relative h-full overflow-hidden rounded-lg border border-slate-700/50'
                  : 'hidden'
              }
            >
              {viewer}
            </div>
            <DrawerPortalTarget />
          </div>
        </DrawerPortalProvider>
      </MapToggleContext.Provider>
    )
  }

  return (
    <MapToggleContext.Provider value={mapToggleValue}>
      <DrawerPortalProvider>
        <div className="h-full px-4 md:overflow-hidden">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
              <div className="relative h-full overflow-hidden">
                <TaskPanel key={task.id} />
                <DrawerPortalTarget />
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle className="ml-2" />
            <ResizablePanel defaultSize={70}>
              <div className="relative h-full overflow-hidden rounded-lg border border-slate-700/50">
                {viewer}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DrawerPortalProvider>
    </MapToggleContext.Provider>
  )
}

export const Task = () => {
  const { task } = useLoaderData({ from: '/_app/tasks/$taskId/' })
  useSetPageTitle(task.name)

  return (
    <TaskProviders>
      <EditorProvider>
        <TaskContent />
      </EditorProvider>
    </TaskProviders>
  )
}
