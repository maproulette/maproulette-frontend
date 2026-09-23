import type { Meta, StoryObj } from '@storybook/react-vite'
import { useId } from 'react'

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from './Field'
import { Input } from './Input'

const ORIENTATIONS = ['vertical', 'horizontal', 'responsive'] as const

const meta: Meta<typeof Field> = {
  component: Field,
  title: 'Inputs/Field',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof Field>

export const Default: Story = {
  render: () => {
    const id = useId()
    return (
      <Field className="max-w-sm">
        <FieldLabel htmlFor={id}>Name</FieldLabel>
        <Input id={id} placeholder="Jane Doe" />
        <FieldDescription>This is displayed on your public profile.</FieldDescription>
      </Field>
    )
  },
}

export const WithError: Story = {
  render: () => {
    const id = useId()
    return (
      <Field className="max-w-sm" data-invalid="true">
        <FieldLabel htmlFor={id}>Email</FieldLabel>
        <Input id={id} placeholder="jane@example.com" aria-invalid />
        <FieldError>Enter a valid email address.</FieldError>
      </Field>
    )
  },
}

export const FieldSetExample: Story = {
  render: () => {
    const firstId = useId()
    const lastId = useId()
    return (
      <FieldSet className="max-w-sm">
        <FieldLegend>Profile</FieldLegend>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={firstId}>First name</FieldLabel>
            <Input id={firstId} placeholder="Jane" />
          </Field>
          <FieldSeparator>and</FieldSeparator>
          <Field>
            <FieldLabel htmlFor={lastId}>Last name</FieldLabel>
            <Input id={lastId} placeholder="Doe" />
          </Field>
        </FieldGroup>
      </FieldSet>
    )
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {ORIENTATIONS.map((orientation) => (
        <Field key={orientation} orientation={orientation} className="max-w-md">
          <FieldContent>
            <FieldTitle>{orientation}</FieldTitle>
            <FieldDescription>Orientation set to "{orientation}".</FieldDescription>
          </FieldContent>
          <Input placeholder={orientation} />
        </Field>
      ))}
    </div>
  ),
}
