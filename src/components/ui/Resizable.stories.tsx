import type { Meta, StoryObj } from '@storybook/react-vite'

import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from './Resizable'

const meta: Meta<typeof ResizablePanelGroup> = {
  component: ResizablePanelGroup,
  title: 'Layout/Resizable',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof ResizablePanelGroup>

export const Horizontal: Story = {
  render: () => (
    <ResizablePanelGroup direction="horizontal" className="h-64 w-full max-w-2xl rounded-lg border">
      <ResizablePanel defaultSize={25} minSize={15}>
        <div className="flex h-full items-center justify-center bg-ocean-100 font-medium text-ocean-900 dark:bg-ocean-950 dark:text-ocean-100">
          Sidebar
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={20}>
        <div className="flex h-full items-center justify-center bg-mint-100 font-medium text-mint-900 dark:bg-mint-950 dark:text-mint-100">
          Main content
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={25} minSize={15}>
        <div className="flex h-full items-center justify-center bg-mango-100 font-medium text-mango-900 dark:bg-mango-950 dark:text-mango-100">
          Details
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}

export const Vertical: Story = {
  render: () => (
    <ResizablePanelGroup direction="vertical" className="h-64 w-full max-w-2xl rounded-lg border">
      <ResizablePanel defaultSize={40} minSize={15}>
        <div className="flex h-full items-center justify-center bg-ocean-100 font-medium text-ocean-900 dark:bg-ocean-950 dark:text-ocean-100">
          Header
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60} minSize={20}>
        <div className="flex h-full items-center justify-center bg-mint-100 font-medium text-mint-900 dark:bg-mint-950 dark:text-mint-100">
          Body
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}

export const WithoutHandleGrip: Story = {
  render: () => (
    <ResizablePanelGroup direction="horizontal" className="h-64 w-full max-w-2xl rounded-lg border">
      <ResizablePanel defaultSize={50} minSize={15}>
        <div className="flex h-full items-center justify-center bg-ocean-100 font-medium text-ocean-900 dark:bg-ocean-950 dark:text-ocean-100">
          Left panel
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} minSize={15}>
        <div className="flex h-full items-center justify-center bg-mint-100 font-medium text-mint-900 dark:bg-mint-950 dark:text-mint-100">
          Right panel
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}
