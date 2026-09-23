import type { Meta, StoryObj } from '@storybook/react-vite'
import { Search } from 'lucide-react'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
} from './InputGroup'

const ALIGNMENTS = ['inline-start', 'inline-end', 'block-start', 'block-end'] as const
const BUTTON_SIZES = ['xs', 'sm', 'icon-xs', 'icon-sm'] as const

const meta: Meta<typeof InputGroup> = {
  component: InputGroup,
  title: 'Inputs/InputGroup',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof InputGroup>

export const Default: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupAddon>
        <Search className="size-4" />
      </InputGroupAddon>
      <InputGroupInput placeholder="Search tasks..." />
    </InputGroup>
  ),
}

export const WithButton: Story = {
  render: () => (
    <InputGroup className="w-72">
      <InputGroupInput placeholder="Enter a challenge id" />
      <InputGroupAddon align="inline-end">
        <InputGroupButton>Go</InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {ALIGNMENTS.map((align) => (
        <InputGroup key={align} className="w-72">
          <InputGroupAddon align={align}>
            <InputGroupText>{align}</InputGroupText>
          </InputGroupAddon>
          <InputGroupInput placeholder={align} />
        </InputGroup>
      ))}
    </div>
  ),
}

export const ButtonSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      {BUTTON_SIZES.map((size) => (
        <InputGroupButton
          key={size}
          size={size}
          aria-label={size.startsWith('icon') ? 'Search' : undefined}
        >
          {size.startsWith('icon') ? <Search /> : size}
        </InputGroupButton>
      ))}
    </div>
  ),
}
