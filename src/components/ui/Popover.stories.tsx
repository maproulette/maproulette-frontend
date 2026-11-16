import type { Meta, StoryObj } from '@storybook/react-vite'
import { MapPin } from 'lucide-react'

import { Button } from './Button'
import { Input } from './Input'
import { Popover, PopoverContent, PopoverTrigger } from './Popover'

const meta: Meta<typeof Popover> = {
  component: Popover,
  title: 'Overlays/Popover',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Popover>

export const Default: Story = {
  render: () => (
    <Popover defaultOpen>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <MapPin className="h-4 w-4" />
          Search location...
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" aria-label="Location suggestions" className="w-72 p-3">
        <Input placeholder="Search location..." defaultValue="Portland, Oregon" />
        <div className="mt-2 flex flex-col gap-1">
          <button
            type="button"
            className="rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-slate-700"
          >
            Portland, Multnomah County, Oregon, United States
          </button>
          <button
            type="button"
            className="rounded px-2 py-1.5 text-left text-sm hover:bg-zinc-50 dark:hover:bg-slate-700"
          >
            Portland, Cumberland County, Maine, United States
          </button>
        </div>
      </PopoverContent>
    </Popover>
  ),
}
