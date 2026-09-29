import type { Meta, StoryObj } from '@storybook/react-vite'

import { Checkbox } from './Checkbox'

const meta: Meta<typeof Checkbox> = {
  component: Checkbox,
  title: 'Inputs/Checkbox',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Checkbox>

export const Default: Story = {
  args: { 'aria-label': 'Accept terms and conditions' },
}

export const Checked: Story = {
  args: { defaultChecked: true, 'aria-label': 'Accept terms and conditions' },
}

export const Indeterminate: Story = {
  args: { indeterminate: true, 'aria-label': 'Select all' },
}

export const Disabled: Story = {
  args: { disabled: true, 'aria-label': 'Accept terms and conditions' },
}

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Checkbox aria-label="Unchecked" />
      <Checkbox aria-label="Checked" defaultChecked />
      <Checkbox aria-label="Indeterminate" indeterminate />
      <Checkbox aria-label="Disabled" disabled />
      <Checkbox aria-label="Disabled and checked" disabled defaultChecked />
    </div>
  ),
}
