import type { Meta, StoryObj } from '@storybook/react-vite'

import { Progress } from './Progress'

const meta: Meta<typeof Progress> = {
  component: Progress,
  title: 'Feedback/Progress',
  tags: ['autodocs'],
  args: {
    value: 40,
  },
  render: (args) => (
    <div className="w-64">
      <Progress {...args} />
    </div>
  ),
}

export default meta

type Story = StoryObj<typeof Progress>

export const Default: Story = {}

export const Empty: Story = {
  args: { value: 0 },
}

export const Complete: Story = {
  args: { value: 100 },
}
