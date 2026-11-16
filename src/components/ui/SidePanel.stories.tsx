import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'

import { Button } from './Button'
import {
  SidePanel,
  SidePanelBody,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
} from './SidePanel'

const meta: Meta<typeof SidePanel> = {
  component: SidePanel,
  title: 'Overlays/SidePanel',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof SidePanel>

// SidePanel is a controlled overlay (open/onClose), similar to a Dialog with no
// uncontrolled/defaultOpen mode. To show it open by default in the canvas, the story
// seeds local state with useState(true) rather than passing a prop the component doesn't have.
export const Default: Story = {
  render: () => {
    const [open, setOpen] = useState(true)

    return (
      <div className="h-96">
        <Button onClick={() => setOpen(true)}>Open panel</Button>
        <SidePanel open={open} onClose={() => setOpen(false)} aria-label="Task details">
          <SidePanelHeader>
            <SidePanelTitle>Task details</SidePanelTitle>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setOpen(false)}
              aria-label="Close"
            >
              ×
            </Button>
          </SidePanelHeader>
          <SidePanelBody>
            <p className="text-sm text-zinc-600 dark:text-slate-400">
              This panel keeps the underlying page in context while showing details for the selected
              item.
            </p>
          </SidePanelBody>
          <SidePanelFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => setOpen(false)}>Save</Button>
          </SidePanelFooter>
        </SidePanel>
      </div>
    )
  },
}

export const Closed: Story = {
  render: () => {
    const [open, setOpen] = useState(false)

    return (
      <div className="h-96">
        <Button onClick={() => setOpen(true)}>Open panel</Button>
        <SidePanel open={open} onClose={() => setOpen(false)} aria-label="Task details">
          <SidePanelHeader>
            <SidePanelTitle>Task details</SidePanelTitle>
          </SidePanelHeader>
          <SidePanelBody>
            <p className="text-sm text-zinc-600 dark:text-slate-400">Panel content.</p>
          </SidePanelBody>
        </SidePanel>
      </div>
    )
  },
}
