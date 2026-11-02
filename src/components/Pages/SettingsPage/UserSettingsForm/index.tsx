import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { api } from '@/api'
import { FieldGroup } from '@/components/ui/Field'
import { Form } from '@/components/ui/Form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useIntl } from '@/i18n'
import type { User, UserSettings } from '@/types/User'
import { ApiSettings } from './ApiSettings'
import {
  basemapSettings,
  getDefaultValues,
  makeFormSchema,
  type SettingsFormValues,
} from './formSchema'
import { GeneralSettings } from './GeneralSettings'
import { useNotificationSubscriptionsDraft } from './NotificationSubscriptionFields'
import { NotificationsSettings } from './NotificationsSettings'
import { PluginSettings } from './PluginSettings'
import { PluginUserSettingsFields } from './PluginUserSettingsFields'

export const UserSettingsForm = ({ user }: { user: User }) => {
  const updateSettingsMutation = api.user.useUpdateUserSettings()
  const subscriptions = useNotificationSubscriptionsDraft(user.id)
  const { locale, t } = useIntl()

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(makeFormSchema(t)),
    defaultValues: getDefaultValues(user.settings, locale),
  })

  const onSubmit = async (values: SettingsFormValues) => {
    try {
      await Promise.all([
        updateSettingsMutation.mutateAsync({
          userId: user.id,
          settings: {
            ...user.settings,
            ...values,
            ...basemapSettings(values, user.settings),
          } as unknown as UserSettings,
        }),
        subscriptions.isDirty ? subscriptions.save() : null,
      ])

      toast.success(
        t({ id: 'settings.account.saveSuccess', defaultMessage: 'User settings updated' })
      )
    } catch {
      toast.error(
        t({
          id: 'settings.account.saveError',
          defaultMessage: 'Failed to update user settings',
        })
      )
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-4 py-4"
      >
        <h1 className="font-bold text-base">
          {t({ id: 'settings.account.title', defaultMessage: 'Account' })}
        </h1>
        <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
          <TabsList>
            <TabsTrigger value="general">
              {t({ id: 'settings.general.title', defaultMessage: 'General' })}
            </TabsTrigger>
            <TabsTrigger value="notifications">
              {t({ id: 'common.notifications', defaultMessage: 'Notifications' })}
            </TabsTrigger>
            <TabsTrigger value="plugins">
              {t({ id: 'common.plugins', defaultMessage: 'Plugins' })}
            </TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>
          <div className="flex max-h-full min-h-0 flex-initial flex-col overflow-hidden rounded-lg bg-zinc-50 p-4 lg:p-6 dark:bg-slate-900">
            <FieldGroup className="min-h-0 flex-auto">
              <TabsContent value="general" fill>
                <GeneralSettings form={form}>
                  <PluginUserSettingsFields form={form} settings={user.settings} />
                </GeneralSettings>
              </TabsContent>
              <TabsContent value="notifications" fill>
                <NotificationsSettings form={form} subscriptions={subscriptions} />
              </TabsContent>
              <TabsContent value="plugins" fill>
                <PluginSettings />
              </TabsContent>
              <TabsContent value="api" fill>
                <ApiSettings />
              </TabsContent>
            </FieldGroup>
          </div>
        </Tabs>
      </form>
    </Form>
  )
}
