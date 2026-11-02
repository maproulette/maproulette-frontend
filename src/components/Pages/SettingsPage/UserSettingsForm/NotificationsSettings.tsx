import type { UseFormReturn } from 'react-hook-form'
import { DocsLink } from '@/components/shared/DocsLink'
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
import { useIntl } from '@/i18n'
import { FieldSubmit } from './FieldSubmit'
import type { SettingsFormValues } from './formSchema'
import {
  NotificationSubscriptionFields,
  type SubscriptionsDraft,
} from './NotificationSubscriptionFields'

export const NotificationsSettings = ({
  form,
  subscriptions,
}: {
  form: UseFormReturn<SettingsFormValues>
  subscriptions: SubscriptionsDraft
}) => {
  const { t } = useIntl()
  return (
    <FieldSet className="min-h-0 flex-auto">
      <FieldLegend>
        {t({ id: 'common.notifications', defaultMessage: 'Notifications' })}
      </FieldLegend>
      <FieldDescription>
        {t({
          id: 'settings.notifications.description',
          defaultMessage:
            'Decide which MapRoulette notifications you would like to receive, along with whether you would like to be sent an email informing you of the notification (either immediately or as a daily digest).',
        })}{' '}
        <DocsLink page="notificationsAndEmail" icon={null}>
          {t({
            id: 'settings.notifications.docsLink',
            defaultMessage: 'Learn about notifications and email',
          })}
        </DocsLink>
      </FieldDescription>
      <FieldGroup className="min-h-0 flex-auto overflow-y-auto px-1">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t({ id: 'common.email', defaultMessage: 'Email' })}</FormLabel>
              <FormControl>
                <Input type="email" {...field} />
              </FormControl>
              <FormDescription>
                {t({
                  id: 'settings.notifications.emailDescription',
                  defaultMessage: 'If you request emails below, they will be sent here.',
                })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <NotificationSubscriptionFields subscriptions={subscriptions} />
      </FieldGroup>
      <FieldSubmit
        isSubmitting={form.formState.isSubmitting}
        isDirty={form.formState.isDirty || subscriptions.isDirty}
      />
    </FieldSet>
  )
}
