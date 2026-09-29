import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'
import { DisabledTooltip } from './DisabledTooltip'

const meta: Meta<typeof DisabledTooltip> = {
  component: DisabledTooltip,
  title: 'Overlays/DisabledTooltip',
  tags: ['autodocs'],
  args: {
    show: true,
    message: 'You need edit permissions to perform this action.',
    children: <Button disabled>Delete project</Button>,
  },
}

export default meta

type Story = StoryObj<typeof DisabledTooltip>

export const Default: Story = {}

export const Hidden: Story = {
  args: {
    show: false,
    children: <Button>Delete project</Button>,
  },
}

export const BottomSide: Story = {
  args: { side: 'bottom' },
}
