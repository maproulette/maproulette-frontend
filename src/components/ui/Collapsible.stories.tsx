import type { Meta, StoryObj } from '@storybook/react-vite'
import { ChevronDown, Lasso, Trash2, Users } from 'lucide-react'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './Collapsible'

const meta: Meta<typeof Collapsible> = {
  component: Collapsible,
  title: 'Overlays/Collapsible',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Collapsible>

export const Default: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-80 rounded-lg bg-card shadow-sm">
      <CollapsibleTrigger className="flex h-10 w-full items-center justify-between gap-2 rounded-lg px-3 transition-colors hover:bg-muted">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-fg-subtle" />
          <span className="font-medium text-fg text-sm">Work on multiple tasks</span>
        </div>
        <ChevronDown className="h-4 w-4 rotate-180 text-fg-subtle transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-2 border-line border-t px-3 pt-2 pb-3">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg bg-muted px-3 py-2 font-medium text-fg text-sm transition-colors hover:bg-muted-strong"
          >
            <Lasso className="h-4 w-4" />
            Draw to add tasks
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-danger text-sm transition-colors hover:bg-danger/10"
          >
            <Trash2 className="h-4 w-4" />
            Work on only the primary task
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
}
