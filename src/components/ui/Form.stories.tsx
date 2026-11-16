import type { Meta, StoryObj } from '@storybook/react-vite'
import { useForm } from 'react-hook-form'

import { Button } from './Button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './Form'
import { Input } from './Input'

type ProfileValues = {
  displayName: string
  email: string
}

const FormExample = () => {
  const form = useForm<ProfileValues>({
    defaultValues: {
      displayName: '',
      email: '',
    },
    mode: 'onSubmit',
  })

  const onSubmit = (values: ProfileValues) => {
    console.log('submitted', values)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-80 space-y-4">
        <FormField
          control={form.control}
          name="displayName"
          rules={{ required: 'Display name is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Display name</FormLabel>
              <FormControl>
                <Input placeholder="Jane Doe" {...field} />
              </FormControl>
              <FormDescription>Shown on your public profile.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          rules={{ required: 'Email is required' }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Save</Button>
      </form>
    </Form>
  )
}

const meta: Meta<typeof FormExample> = {
  component: FormExample,
  title: 'Inputs/Form',
  tags: ['autodocs'],
}

export default meta

type Story = StoryObj<typeof FormExample>

export const Default: Story = {
  render: () => <FormExample />,
}

export const WithValidationError: Story = {
  render: () => {
    const form = useForm<ProfileValues>({
      defaultValues: { displayName: '', email: '' },
      mode: 'onSubmit',
    })

    // Trigger validation once on mount so the error state is visible in the canvas.
    void form.trigger()

    return (
      <Form {...form}>
        <form className="w-80 space-y-4">
          <FormField
            control={form.control}
            name="displayName"
            rules={{ required: 'Display name is required' }}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Display name</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    )
  },
}
