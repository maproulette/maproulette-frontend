import type { Meta, StoryObj } from '@storybook/react-vite'
import { Heart } from 'lucide-react'

import { Button } from './Button'
import { Tooltip, TooltipContent, TooltipTrigger } from './Tooltip'

const meta: Meta<typeof Tooltip> = {
  component: Tooltip,
  title: 'Overlays/Tooltip',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: () => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label="Like challenge">
          <Heart className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Like challenge</TooltipContent>
    </Tooltip>
  ),
}
