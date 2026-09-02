import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { DocsLink } from '@/components/shared/DocsLink'
import { Button } from '@/components/ui/Button'
import { FieldDescription, FieldGroup, FieldLegend, FieldSet } from '@/components/ui/Field'
import { Label } from '@/components/ui/Label'
import { Loader } from '@/components/ui/Loader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select'
import {
  COUNT_FIELDS,
  type NotificationSubscriptions,
  SUBSCRIPTION_FIELDS,
  subscriptionFrequencyOptions,
  subscriptionLevelOptions,
  withSubscriptionDefaults,
} from '@/lib/notificationSubscriptions'

interface RowProps {
  id: string
  label: string
  description: string
  value: number
  options: { value: number; label: string }[]
  onChange: (value: number) => void
}

const SubscriptionRow = ({ id, label, description, value, options, onChange }: RowProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-zinc-200 border-b py-3 last:border-b-0 dark:border-slate-700">
    <div className="min-w-48 flex-1">
      <Label htmlFor={id}>{label}</Label>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
    </div>
    <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger id={id} className="w-72">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={String(option.value)}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

/**
 * Per-notification delivery preferences. These live behind their own endpoint
 * rather than the user's settings object, so this tab keeps its own draft and
 * Save button instead of joining the account form's submit.
 */
export const NotificationSubscriptionsSettings = ({ userId }: { userId: number }) => {
  const { data, isLoading, isError } = api.user.notificationSubscriptions(userId)
  const updateMutation = api.user.useUpdateNotificationSubscriptions()
  const [draft, setDraft] = useState<NotificationSubscriptions | null>(null)

  // Seed the draft once the server's copy arrives, and whenever it changes
  // underneath us (another tab, say).
  useEffect(() => {
    if (data) setDraft(withSubscriptionDefaults(data))
  }, [data])

  if (isLoading) return <Loader message="Loading notification preferences..." />
  if (isError || !draft) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Notification preferences could not be loaded.
      </p>
    )
  }

  const setField = (key: keyof NotificationSubscriptions, value: number) =>
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev))

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ userId, subscriptions: draft })
      toast.success('Notification preferences updated')
    } catch {
      toast.error('Failed to update notification preferences')
    }
  }

  return (
    <FieldSet>
      <FieldLegend>Notification Subscriptions</FieldLegend>
      <FieldDescription>
        Decide which MapRoulette notifications you would like to receive, along with whether you
        would like to be sent an email informing you of the notification (either immediately or as a
        daily digest).{' '}
        <DocsLink page="notificationsAndEmail" icon={null}>
          Learn about notifications and email
        </DocsLink>
      </FieldDescription>
      <FieldGroup>
        <div>
          {SUBSCRIPTION_FIELDS.map(({ key, label, description }) => (
            <SubscriptionRow
              key={key}
              id={`subscription-${key}`}
              label={label}
              description={description}
              value={draft[key] as number}
              options={subscriptionLevelOptions}
              onChange={(value) => setField(key, value)}
            />
          ))}
        </div>

        <FieldSet>
          <FieldLegend>Periodic summaries</FieldLegend>
          <FieldDescription>
            These are sent on a schedule rather than when something happens.
          </FieldDescription>
          <div>
            {COUNT_FIELDS.map(({ key, label, description }) => (
              <SubscriptionRow
                key={key}
                id={`subscription-${key}`}
                label={label}
                description={description}
                value={draft[key] as number}
                options={subscriptionFrequencyOptions}
                onChange={(value) => setField(key, value)}
              />
            ))}
          </div>
        </FieldSet>
      </FieldGroup>

      <div className="flex justify-end">
        <Button type="button" onClick={handleSave} disabled={updateMutation.isPending}>
          {updateMutation.isPending ? 'Saving...' : 'Submit'}
        </Button>
      </div>
    </FieldSet>
  )
}
