import type { Meta, StoryObj } from '@storybook/react-vite'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select'

const meta: Meta<typeof Select> = {
  component: Select,
  title: 'Inputs/Select',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => (
    <Select defaultValue="Normal" defaultOpen>
      {/* Real usage (e.g. DifficultyFilter) always pairs SelectTrigger with an
          accessible name — SelectValue's text isn't guaranteed to be available
          to assistive tech the instant the trigger mounts. */}
      <SelectTrigger className="h-9 w-32" aria-label="Difficulty">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Any">Any</SelectItem>
        <SelectItem value="Easy">Easy</SelectItem>
        <SelectItem value="Normal">Normal</SelectItem>
        <SelectItem value="Expert">Expert</SelectItem>
      </SelectContent>
    </Select>
  ),
}
