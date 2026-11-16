import type { Meta, StoryObj } from '@storybook/react-vite'

import { ScrollArea } from './ScrollArea'

const ITEMS = Array.from({ length: 30 }, (_, index) => `Item ${index + 1}`)

const meta: Meta<typeof ScrollArea> = {
  component: ScrollArea,
  title: 'Layout/ScrollArea',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof ScrollArea>

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-72 w-64 rounded-lg border">
      <div className="p-4">
        <h4 className="mb-3 font-medium text-sm">Tags</h4>
        {ITEMS.map((item) => (
          <div
            key={item}
            className="border-zinc-100 border-b py-2 text-sm last:border-0 dark:border-slate-800"
          >
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-96 whitespace-nowrap rounded-lg border">
      <div className="flex gap-3 p-4">
        {ITEMS.slice(0, 15).map((item) => (
          <div
            key={item}
            className="flex h-20 w-24 shrink-0 items-center justify-center rounded-md bg-zinc-100 text-sm dark:bg-slate-800"
          >
            {item}
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
}
