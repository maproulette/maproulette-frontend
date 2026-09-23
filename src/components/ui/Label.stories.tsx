import type { Meta, StoryObj } from '@storybook/react-vite'
import { useId } from 'react'

import { Input } from './Input'
import { Label } from './Label'

const meta: Meta<typeof Label> = {
  component: Label,
  title: 'Inputs/Label',
  tags: ['autodocs'],
  args: {
    children: 'Label',
  },
}

export default meta

type Story = StoryObj<typeof Label>

export const Default: Story = {}

export const WithInput: Story = {
  render: () => {
    const emailId = useId()

    return (
      <div className="flex flex-col gap-2">
        <Label htmlFor={emailId}>Email address</Label>
        <Input id={emailId} type="email" placeholder="you@example.com" />
      </div>
    )
  },
}
