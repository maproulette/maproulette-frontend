import type { Meta, StoryObj } from '@storybook/react-vite'

import { Badge } from './Badge'

const VARIANTS = [
  'default',
  'secondary',
  'success',
  'warning',
  'caution',
  'info',
  'destructive',
  'outline',
] as const

const meta: Meta<typeof Badge> = {
  component: Badge,
  title: 'Foundation/Badge',
  tags: ['autodocs'],
  args: {
    children: 'Badge',
  },
}

export default meta

type Story = StoryObj<typeof Badge>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {VARIANTS.map((variant) => (
        <Badge key={variant} variant={variant}>
          {variant}
        </Badge>
      ))}
    </div>
  ),
}
