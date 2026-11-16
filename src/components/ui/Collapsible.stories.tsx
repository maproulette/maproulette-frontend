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
    <Collapsible defaultOpen className="w-80 rounded-lg bg-white shadow-sm dark:bg-slate-800">
      <CollapsibleTrigger className="flex h-10 w-full items-center justify-between gap-2 rounded-lg px-3 transition-colors hover:bg-zinc-50 dark:hover:bg-slate-700/50">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-blue-500" />
          <span className="font-medium text-sm text-zinc-700 dark:text-zinc-200">
            Work on multiple tasks
          </span>
        </div>
        <ChevronDown className="h-4 w-4 rotate-180 text-zinc-400 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="flex flex-col gap-2 border-zinc-200 border-t px-3 pt-2 pb-3 dark:border-slate-700">
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 font-medium text-sm text-zinc-700 transition-colors hover:bg-zinc-200 dark:bg-slate-700 dark:text-zinc-200 dark:hover:bg-slate-600"
          >
            <Lasso className="h-4 w-4" />
            Draw to add tasks
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 font-medium text-red-600 text-sm transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            <Trash2 className="h-4 w-4" />
            Work on only the primary task
          </button>
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
}
