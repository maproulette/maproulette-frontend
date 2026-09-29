import type { Meta, StoryObj } from '@storybook/react-vite'

import { Spinner } from './Spinner'

const meta: Meta<typeof Spinner> = {
  component: Spinner,
  title: 'Feedback/Spinner',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Spinner>

export const Default: Story = {}

export const Large: Story = {
  args: { className: 'size-8 animate-spin' },
}
