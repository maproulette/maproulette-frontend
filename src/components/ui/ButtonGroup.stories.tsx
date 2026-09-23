import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from './ButtonGroup'

const ORIENTATIONS = ['horizontal', 'vertical'] as const

const meta: Meta<typeof ButtonGroup> = {
  component: ButtonGroup,
  title: 'Layout/ButtonGroup',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof ButtonGroup>

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">One</Button>
      <Button variant="outline">Two</Button>
      <Button variant="outline">Three</Button>
    </ButtonGroup>
  ),
}

export const WithText: Story = {
  render: () => (
    <ButtonGroup>
      <ButtonGroupText>Filter</ButtonGroupText>
      <Button variant="outline">Apply</Button>
    </ButtonGroup>
  ),
}

export const WithSeparator: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Copy</Button>
      <ButtonGroupSeparator />
      <Button variant="outline">Paste</Button>
    </ButtonGroup>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-4">
      {ORIENTATIONS.map((orientation) => (
        <ButtonGroup key={orientation} orientation={orientation}>
          <Button variant="outline">One</Button>
          <Button variant="outline">Two</Button>
          <Button variant="outline">Three</Button>
        </ButtonGroup>
      ))}
    </div>
  ),
}
