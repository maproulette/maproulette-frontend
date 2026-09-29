import type { Meta, StoryObj } from '@storybook/react-vite'

import { Kbd } from './Kbd'

const meta: Meta<typeof Kbd> = {
  component: Kbd,
  title: 'Foundation/Kbd',
  tags: ['autodocs'],
  args: {
    children: 'K',
  },
}

export default meta

type Story = StoryObj<typeof Kbd>

export const Default: Story = {}

export const Shortcut: Story = {
  render: () => (
    <span className="inline-flex items-center gap-1">
      <Kbd>⌘</Kbd>
      <span className="text-[0.625rem] text-zinc-400">+</span>
      <Kbd>K</Kbd>
    </span>
  ),
}
