import type { Meta, StoryObj } from '@storybook/react-vite'
import { useId } from 'react'

import { FormSection, FormSectionGroup } from './FormSection'
import { Input } from './Input'
import { Label } from './Label'

const meta: Meta<typeof FormSection> = {
  component: FormSection,
  title: 'Inputs/FormSection',
  tags: ['autodocs'],
  args: {
    title: 'Profile',
    description: 'Update your account details.',
  },
}

export default meta

type Story = StoryObj<typeof FormSection>

export const Default: Story = {
  render: (args) => {
    const nameId = useId()
    const emailId = useId()

    return (
      <div className="w-96">
        <FormSection {...args}>
          <div className="space-y-1.5">
            <Label htmlFor={nameId}>Name</Label>
            <Input id={nameId} placeholder="Jane Doe" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={emailId}>Email</Label>
            <Input id={emailId} placeholder="jane@example.com" />
          </div>
        </FormSection>
      </div>
    )
  },
}

export const WithoutHeader: Story = {
  args: {
    title: undefined,
    description: undefined,
  },
  render: (args) => {
    const nameId = useId()

    return (
      <div className="w-96">
        <FormSection {...args}>
          <div className="space-y-1.5">
            <Label htmlFor={nameId}>Name</Label>
            <Input id={nameId} placeholder="Jane Doe" />
          </div>
        </FormSection>
      </div>
    )
  },
}

export const MultipleSections: Story = {
  render: () => {
    const nameId = useId()
    const emailId = useId()

    return (
      <div className="w-96">
        <FormSectionGroup>
          <FormSection title="Profile" description="Update your account details.">
            <div className="space-y-1.5">
              <Label htmlFor={nameId}>Name</Label>
              <Input id={nameId} placeholder="Jane Doe" />
            </div>
          </FormSection>
          <FormSection title="Notifications" description="Choose how you hear from us.">
            <div className="space-y-1.5">
              <Label htmlFor={emailId}>Email</Label>
              <Input id={emailId} placeholder="jane@example.com" />
            </div>
          </FormSection>
        </FormSectionGroup>
      </div>
    )
  },
}
