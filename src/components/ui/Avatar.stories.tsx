import type { Meta, StoryObj } from '@storybook/react-vite'

import { Avatar, AvatarFallback, AvatarImage } from './Avatar'

const meta: Meta<typeof Avatar> = {
  component: Avatar,
  title: 'Layout/Avatar',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/150?img=1" alt="User avatar" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
}

export const FallbackOnly: Story = {
  render: () => (
    <Avatar>
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
}

export const BrokenImage: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://example.invalid/missing.png" alt="User avatar" />
      <AvatarFallback>JD</AvatarFallback>
    </Avatar>
  ),
}
