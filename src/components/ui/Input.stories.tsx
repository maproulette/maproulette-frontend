import type { Meta, StoryObj } from '@storybook/react-vite'

import { Input } from './Input'

const meta: Meta<typeof Input> = {
  component: Input,
  title: 'Inputs/Input',
  tags: ['autodocs'],
  args: {
    placeholder: 'Enter some text...',
  },
}

export default meta

type Story = StoryObj<typeof Input>

export const Default: Story = {}

export const WithValue: Story = {
  args: { defaultValue: 'Hello world' },
}

export const Disabled: Story = {
  args: { disabled: true, defaultValue: 'Cannot edit this' },
}

export const Invalid: Story = {
  args: { 'aria-invalid': true, defaultValue: 'Invalid value' },
}
