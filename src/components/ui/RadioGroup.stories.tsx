import type { Meta, StoryObj } from '@storybook/react-vite'
import { useId } from 'react'

import { Label } from './Label'
import { RadioGroup, RadioGroupItem } from './RadioGroup'

const meta: Meta<typeof RadioGroup> = {
  component: RadioGroup,
  title: 'Inputs/RadioGroup',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof RadioGroup>

export const Default: Story = {
  render: () => {
    const randomId = useId()
    const nearbyId = useId()
    const noneId = useId()
    return (
      <RadioGroup defaultValue="random" className="max-w-sm">
        <div className="flex items-center gap-2">
          <RadioGroupItem value="random" id={randomId} />
          <Label htmlFor={randomId}>Random High Priority Task</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="nearby" id={nearbyId} />
          <Label htmlFor={nearbyId}>Nearby Task</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="none" id={noneId} disabled />
          <Label htmlFor={noneId}>No further tasks (disabled)</Label>
        </div>
      </RadioGroup>
    )
  },
}
