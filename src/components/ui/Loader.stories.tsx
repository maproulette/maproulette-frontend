import type { Meta, StoryObj } from '@storybook/react-vite'

import { Loader } from './Loader'

const meta: Meta<typeof Loader> = {
  component: Loader,
  title: 'Feedback/Loader',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Loader>

export const Default: Story = {}

export const WithCustomMessage: Story = {
  args: { message: 'Fetching your tasks...' },
}

export const FullScreen: Story = {
  args: { isFullScreen: true, message: 'Loading MapRoulette...' },
}
