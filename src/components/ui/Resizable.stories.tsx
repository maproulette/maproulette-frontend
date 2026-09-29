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
        <div className="flex h-full items-center justify-center bg-blue-100 font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-100">
          Sidebar
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={50} minSize={20}>
        <div className="flex h-full items-center justify-center bg-emerald-100 font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          Main content
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={25} minSize={15}>
        <div className="flex h-full items-center justify-center bg-amber-100 font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-100">
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
        <div className="flex h-full items-center justify-center bg-blue-100 font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-100">
          Header
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60} minSize={20}>
        <div className="flex h-full items-center justify-center bg-emerald-100 font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
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
        <div className="flex h-full items-center justify-center bg-blue-100 font-medium text-blue-900 dark:bg-blue-950 dark:text-blue-100">
          Left panel
        </div>
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize={50} minSize={15}>
        <div className="flex h-full items-center justify-center bg-emerald-100 font-medium text-emerald-900 dark:bg-emerald-950 dark:text-emerald-100">
          Right panel
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
}
