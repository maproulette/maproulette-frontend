import type { Meta, StoryObj } from '@storybook/react-vite'
import { TriangleAlert } from 'lucide-react'

import { Button } from './Button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './Empty'

const MEDIA_VARIANTS = ['default', 'icon'] as const

const meta: Meta<typeof Empty> = {
  component: Empty,
  title: 'Feedback/Empty',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Empty>

export const Default: Story = {
  render: () => (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <TriangleAlert />
        </EmptyMedia>
        <EmptyTitle>Page Not Found</EmptyTitle>
        <EmptyDescription>The page you are looking for does not exist.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="lg">Head back home</Button>
      </EmptyContent>
    </Empty>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-8">
      {MEDIA_VARIANTS.map((variant) => (
        <div key={variant} className="flex flex-col items-center gap-2">
          <EmptyMedia variant={variant}>
            <TriangleAlert />
          </EmptyMedia>
          <span className="text-xs text-zinc-600">{variant}</span>
        </div>
      ))}
    </div>
  ),
}
