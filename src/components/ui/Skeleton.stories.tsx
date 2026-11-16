import type { Meta, StoryObj } from '@storybook/react-vite'

import { Skeleton } from './Skeleton'

const meta: Meta<typeof Skeleton> = {
  component: Skeleton,
  title: 'Feedback/Skeleton',
  tags: ['autodocs'],
  args: {
    className: 'h-4 w-[250px]',
  },
}

export default meta

type Story = StoryObj<typeof Skeleton>

export const Default: Story = {}

export const AvatarPlaceholder: Story = {
  args: { className: 'size-12 rounded-full' },
}

export const TextLines: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Skeleton className="h-4 w-[250px]" />
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-4 w-[150px]" />
    </div>
  ),
}
