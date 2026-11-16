import type { Meta, StoryObj } from '@storybook/react-vite'
import { Users } from 'lucide-react'

import { StatCard, StatCardGrid } from './StatCard'

const TONES = ['neutral', 'muted', 'info', 'success', 'warning', 'danger'] as const
const SIZES = ['sm', 'md', 'lg'] as const

const meta: Meta<typeof StatCard> = {
  component: StatCard,
  title: 'Feedback/StatCard',
  tags: ['autodocs'],
  args: {
    label: 'Total Tasks',
    value: '1,204',
  },
}

export default meta

type Story = StoryObj<typeof StatCard>

export const Default: Story = {}

export const WithIconAndDescription: Story = {
  args: {
    label: 'Contributors',
    value: '328',
    icon: <Users className="size-4" />,
    description: '+12 this week',
  },
}

export const Grid: Story = {
  render: () => (
    <StatCardGrid>
      <StatCard label="Total Tasks" value="1,204" tone="neutral" />
      <StatCard label="Completed" value="892" tone="success" />
      <StatCard label="Needs Review" value="47" tone="warning" />
      <StatCard label="Errors" value="3" tone="danger" />
    </StatCardGrid>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      {SIZES.map((size) => (
        <div key={size} className="flex flex-wrap gap-2">
          {TONES.map((tone) => (
            <StatCard
              key={`${size}-${tone}`}
              tone={tone}
              size={size}
              label={`${tone} / ${size}`}
              value="42"
            />
          ))}
        </div>
      ))}
    </div>
  ),
}
