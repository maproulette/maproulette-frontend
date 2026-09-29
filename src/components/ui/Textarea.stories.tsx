import type { Meta, StoryObj } from '@storybook/react-vite'

import { Textarea } from './Textarea'

const meta: Meta<typeof Textarea> = {
  component: Textarea,
  title: 'Inputs/Textarea',
  tags: ['autodocs'],
  args: {
    placeholder: 'Type your message here...',
  },
}

export default meta

type Story = StoryObj<typeof Textarea>

export const Default: Story = {}

export const WithValue: Story = {
  args: { defaultValue: 'This is some example text spanning the textarea.' },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Cannot edit this' },
}
