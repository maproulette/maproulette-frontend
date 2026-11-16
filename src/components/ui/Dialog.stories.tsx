import type { Meta, StoryObj } from '@storybook/react-vite'

import { Button } from './Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './Dialog'

const meta: Meta<typeof Dialog> = {
  component: Dialog,
  title: 'Overlays/Dialog',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Dialog>

export const Default: Story = {
  render: () => (
    <Dialog defaultOpen>
      <DialogTrigger asChild>
        <Button variant="outline">Report Challenge</Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Report Challenge</DialogTitle>
          <DialogDescription>
            You are about to report a Challenge. Your report goes to the MapRoulette administrators
            for review, and a comment naming you is posted on the Challenge so its creator knows it
            was raised.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">Submit Report</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
}
