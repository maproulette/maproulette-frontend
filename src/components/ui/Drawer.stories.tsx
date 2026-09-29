import type { Meta, StoryObj } from '@storybook/react-vite'
import { X } from 'lucide-react'

import { Button } from './Button'
import { Drawer } from './Drawer'

const meta: Meta<typeof Drawer> = {
  component: Drawer,
  title: 'Overlays/Drawer',
  tags: ['autodocs'],
  parameters: {
    // The drawer positions itself relative to its nearest positioned ancestor
    // unless `fixed` is set, so the canvas needs some height to slide within.
    layout: 'fullscreen',
  },
}

export default meta

type Story = StoryObj<typeof Drawer>

export const Default: Story = {
  render: () => (
    <div className="relative h-[480px] overflow-hidden rounded-lg border border-zinc-200 dark:border-slate-700">
      <Drawer open onClose={() => {}}>
        <div className="flex items-center justify-between border-zinc-200 border-b px-4 py-3 dark:border-slate-700">
          <h2 className="font-semibold text-lg text-zinc-900 dark:text-white">
            Fix broken sidewalk connection
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={() => {}} aria-label="Close">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
          <p className="text-sm text-zinc-600 dark:text-slate-300">
            This sidewalk segment does not connect to the crosswalk. Compare against recent imagery
            and adjust the geometry so pedestrians have a continuous path.
          </p>
        </div>
      </Drawer>
    </div>
  ),
}
