import { useBrowsedProjectContext } from '@/components/Pages/BrowsedProjectPage/contexts/BrowsedProjectContext'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/Resizable'
import { useSetPageTitleContext } from '@/contexts/PageTitleContext'
import { ChallengesList } from './ChallengesList'
import { ProjectDetail } from './ProjectDetail'

export const BrowsedProjectPageContent = () => {
  const { project } = useBrowsedProjectContext()
  const projectName = project?.displayName || project?.name || null
  useSetPageTitleContext(projectName ?? null)

  return (
    <div className="h-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
          <ProjectDetail />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={70} minSize={40}>
          <div className="flex h-full min-h-0 min-w-0 flex-col pl-2">
            <ChallengesList />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
