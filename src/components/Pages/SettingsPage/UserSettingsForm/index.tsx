import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'
import { api } from '@/api'
import { FieldGroup } from '@/components/ui/Field'
import { Form } from '@/components/ui/Form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useIntl } from '@/i18n'
import type { User, UserSettings } from '@/types/User'
import { ApiSettings } from './ApiSettings'
import { formSchema } from './formSchema'
import { GeneralSettings } from './GeneralSettings'
import { useNotificationSubscriptionsDraft } from './NotificationSubscriptionFields'
import { NotificationsSettings } from './NotificationsSettings'
import { PluginSettings } from './PluginSettings'
import { PluginUserSettingsFields } from './PluginUserSettingsFields'

export const UserSettingsForm = ({ user }: { user: User }) => {
  const updateSettingsMutation = api.user.useUpdateUserSettings()
  const subscriptions = useNotificationSubscriptionsDraft(user.id)
  const { locale } = useIntl()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      defaultEditor: user.settings.defaultEditor ?? -1,
      defaultBasemap: user.settings.defaultBasemap ?? -1,
      defaultBasemapId: user.settings.defaultBasemapId ?? '',
      email: user.settings.email ?? '',
      allowFollowing: user.settings.allowFollowing ?? true,
      locale: user.settings.locale ?? locale,
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await Promise.all([
        updateSettingsMutation.mutateAsync({
          userId: user.id,
            settings: { ...user.settings, ...values } as unknown as UserSettings,
        }),
        subscriptions.isDirty ? subscriptions.save() : null,
      ])

      toast.success('User settings updated')
    } catch {
      toast.error('Failed to update user settings')
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col gap-4 py-4"
      >
        <h1 className="font-bold text-base">Account</h1>
        <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="plugins">Plugins</TabsTrigger>
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
