import type { Meta, StoryObj } from '@storybook/react-vite'

import { Separator } from './Separator'

const meta: Meta<typeof Separator> = {
  component: Separator,
  title: 'Layout/Separator',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Separator>

export const Default: Story = {
  render: () => (
    <div className="w-64">
      <p className="text-sm">Above the separator</p>
      <Separator className="my-4" />
      <p className="text-sm">Below the separator</p>
    </div>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="flex h-5 items-center gap-4">
      <span className="text-sm">Item 1</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Item 2</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Item 3</span>
    </div>
  ),
}
