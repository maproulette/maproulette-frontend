import type { Meta, StoryObj } from '@storybook/react-vite'
import { Copy, Eye, MoreHorizontal, Play, Trash2 } from 'lucide-react'

import { Button } from './Button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './DropdownMenu'

const meta: Meta<typeof DropdownMenu> = {
  component: DropdownMenu,
  title: 'Overlays/DropdownMenu',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof DropdownMenu>

export const Default: Story = {
  render: () => (
    <DropdownMenu defaultOpen>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Play className="h-4 w-4" />
          Start challenge
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Eye className="h-4 w-4" />
          View challenge
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="h-4 w-4" />
          Copy URL
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive">
          <Trash2 className="h-4 w-4" />
          Delete challenge
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  ),
}
