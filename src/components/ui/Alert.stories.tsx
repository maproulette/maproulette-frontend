import type { Meta, StoryObj } from '@storybook/react-vite'

import { Alert, AlertDescription, AlertTitle } from './Alert'

const VARIANTS = ['default', 'destructive', 'warning'] as const

const meta: Meta<typeof Alert> = {
  component: Alert,
  title: 'Feedback/Alert',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Alert>

export const Default: Story = {
  render: () => (
    <Alert>
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>This is an informational alert.</AlertDescription>
    </Alert>
  ),
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      {VARIANTS.map((variant) => (
        <Alert key={variant} variant={variant}>
          <AlertTitle>{variant}</AlertTitle>
          <AlertDescription>This is a {variant} alert.</AlertDescription>
        </Alert>
      ))}
    </div>
  ),
}
