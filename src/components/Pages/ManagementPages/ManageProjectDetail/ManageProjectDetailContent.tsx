import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable'
import { ProjectChallengesPanel } from './ProjectChallengesPanel'
import { ProjectDetailDialogs } from './ProjectDetailDialogs'
import { ProjectDetailSidebar } from './ProjectDetailSidebar'

export const ManageProjectDetailContent = () => {
  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
          <aside className="h-full min-h-0 overflow-hidden pr-2">
            <ProjectDetailSidebar />
          </aside>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={70} minSize={40}>
          <ProjectChallengesPanel />
        </ResizablePanel>
      </ResizablePanelGroup>

      <ProjectDetailDialogs />
    </div>
  )
}
