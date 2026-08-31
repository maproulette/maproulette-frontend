import type { UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/Field'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/Form'
import { Input } from '@/components/ui/Input'
import { FieldSubmit } from './FieldSubmit'
import type { formSchema } from './formSchema'

export const NotificationsSettings = ({
  form,
}: {
  form: UseFormReturn<z.infer<typeof formSchema>>
}) => {
  return (
    <FieldSet>
      <FieldLegend>Notifications</FieldLegend>
      <FieldDescription>Manage your notification preferences.</FieldDescription>
      <FieldGroup>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormDescription>
                If you request emails in your Notification Subscriptions, they will be sent here.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FieldSet>
          <FieldLegend>Notification Subscriptions</FieldLegend>
          <FieldDescription>
            Decide which MapRoulette notifications you would like to receive, along with whether you
            would like to be sent an email informing you of the notification (either immediately or
            as a daily digest)
          </FieldDescription>
          <FieldGroup>{/* Placeholder for future notification subscription options */}</FieldGroup>
        </FieldSet>
      </FieldGroup>
      <FieldSubmit isSubmitting={form.formState.isSubmitting} isDirty={form.formState.isDirty} />
    </FieldSet>
  )
}
