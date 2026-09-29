import type { Meta, StoryObj } from '@storybook/react-vite'

import { Logomark } from './Logomark'

const meta: Meta<typeof Logomark> = {
  component: Logomark,
  title: 'Foundation/Logomark',
  tags: ['autodocs'],
  args: {
    className: 'size-12',
  },
}

export default meta

type Story = StoryObj<typeof Logomark>

export const Default: Story = {}

export const Animated: Story = {
  args: { isAnimated: true },
}
