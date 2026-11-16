import type { Meta, StoryObj } from '@storybook/react-vite'

import { Switch } from './Switch'

const meta: Meta<typeof Switch> = {
  component: Switch,
  title: 'Inputs/Switch',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Switch>

export const Default: Story = {
  args: { 'aria-label': 'Enable notifications' },
}

export const Checked: Story = {
  args: { defaultChecked: true, 'aria-label': 'Enable notifications' },
}

export const Disabled: Story = {
  args: { disabled: true, 'aria-label': 'Enable notifications' },
}

export const DisabledChecked: Story = {
  args: { disabled: true, defaultChecked: true, 'aria-label': 'Enable notifications' },
}
