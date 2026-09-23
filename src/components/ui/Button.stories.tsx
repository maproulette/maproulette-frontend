import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'

const VARIANTS = [
  'default',
  'destructive',
  'outline',
  'secondary',
  'ghost',
  'link',
  'success',
  'info',
  'warning',
  'caution',
] as const

const SIZES = ['default', 'sm', 'lg', 'icon', 'icon-sm', 'icon-lg'] as const

const meta: Meta<typeof Button> = {
  component: Button,
  title: 'Foundation/Button',
  tags: ['autodocs'],
  args: {
    children: 'Button',
  },
}

export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {VARIANTS.map((variant) => (
        <Button key={variant} variant={variant}>
          {variant}
        </Button>
      ))}
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {SIZES.map((size) => (
        <Button key={size} size={size}>
          {size}
        </Button>
      ))}
    </div>
  ),
}

export const Disabled: Story = {
  args: { disabled: true },
}
