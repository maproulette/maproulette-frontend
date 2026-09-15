import { useLoaderData } from '@tanstack/react-router'
import { TaskMap } from '@/components/Pages/TaskEditPage/TaskMap'
import {
  DrawerPortalProvider,
  DrawerPortalTarget,
} from '@/components/TaskInfoPanel/DrawerPortalContext'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable'
import { useSetPageTitle } from '@/contexts/ChromeContext'
import { EditorProvider, useEditorContext } from './contexts/EditorContext'
import { IdEditorView } from './IdEditorView'
import { TaskProviders } from './TaskLayout'
import { TaskPanel } from './TaskPanel'

const viewPanelClass = (isActive: boolean) =>
  isActive ? 'absolute inset-0 z-[1]' : 'invisible absolute inset-0 z-0 pointer-events-none'

const TaskContent = () => {
  const { activeView, idEditorMounted, showMap } = useEditorContext()

  return (
    <DrawerPortalProvider>
      <div className="h-full px-4 md:overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          <ResizablePanel defaultSize={30} minSize={20} maxSize={50}>
            <div className="relative h-full overflow-hidden">
              <TaskPanel />
              <DrawerPortalTarget />
            </div>
          </ResizablePanel>
          <ResizableHandle withHandle className="ml-2" />
          <ResizablePanel defaultSize={70}>
            <div className="relative h-full overflow-hidden rounded-lg border border-slate-700/50">
              <div className={viewPanelClass(activeView === 'map')}>
                <TaskMap />
              </div>
              {idEditorMounted && (
                <div className={viewPanelClass(activeView === 'id')}>
                  <IdEditorView onClose={showMap} />
                </div>
              )}
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </DrawerPortalProvider>
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
