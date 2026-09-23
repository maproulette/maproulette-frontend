import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bold } from 'lucide-react'

import { Toggle } from './Toggle'

const VARIANTS = ['default', 'outline'] as const
const SIZES = ['default', 'sm', 'lg'] as const

const meta: Meta<typeof Toggle> = {
  component: Toggle,
  title: 'Inputs/Toggle',
  tags: ['autodocs'],
  args: {
    children: <Bold />,
    'aria-label': 'Toggle bold',
  },
}

export default meta

type Story = StoryObj<typeof Toggle>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {VARIANTS.map((variant) => (
        <Toggle key={variant} variant={variant} aria-label={`Toggle ${variant}`}>
          {variant}
        </Toggle>
      ))}
    </div>
  ),
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {SIZES.map((size) => (
        <Toggle key={size} size={size} aria-label={`Toggle ${size}`}>
          {size}
        </Toggle>
      ))}
    </div>
  ),
}
