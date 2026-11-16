import type { Meta, StoryObj } from '@storybook/react-vite'

import { Panel } from './Panel'

const TONES = ['neutral', 'muted', 'info', 'success', 'warning', 'danger'] as const
const PADDINGS = ['none', 'sm', 'md', 'lg'] as const
const ELEVATIONS = ['none', 'sm', 'md', 'lg'] as const

const meta: Meta<typeof Panel> = {
  component: Panel,
  title: 'Layout/Panel',
  tags: ['autodocs'],
  args: {
    children: 'Panel content',
  },
}

export default meta

type Story = StoryObj<typeof Panel>

export const Default: Story = {}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {TONES.map((tone) => (
        <Panel key={tone} tone={tone}>
          {tone}
        </Panel>
      ))}
    </div>
  ),
}

export const AllPadding: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-2">
      {PADDINGS.map((padding) => (
        <Panel key={padding} tone="neutral" padding={padding}>
          {padding}
        </Panel>
      ))}
    </div>
  ),
}

export const AllElevation: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-2">
      {ELEVATIONS.map((elevation) => (
        <Panel key={elevation} tone="neutral" elevation={elevation}>
          {elevation}
        </Panel>
      ))}
    </div>
  ),
}
