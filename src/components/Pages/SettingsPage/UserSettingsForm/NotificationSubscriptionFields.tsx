import { useEffect, useState } from 'react'
import { api } from '@/api'
import { FieldDescription, FieldLegend, FieldSet } from '@/components/ui/Field'
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

export interface SubscriptionsDraft {
  draft: NotificationSubscriptions | null
  setField: (key: keyof NotificationSubscriptions, value: number) => void
  isDirty: boolean
  save: () => Promise<unknown>
  isLoading: boolean
  isError: boolean
}

/**
 * Per-notification delivery preferences. These live behind their own endpoint
 * rather than the user's settings object, so they're kept as a draft here and
 * saved alongside the account form when it submits.
 */
export const useNotificationSubscriptionsDraft = (userId: number): SubscriptionsDraft => {
  const { data, isLoading, isError } = api.user.notificationSubscriptions(userId)
  const updateMutation = api.user.useUpdateNotificationSubscriptions()
  const [draft, setDraft] = useState<NotificationSubscriptions | null>(null)

  // Seed the draft once the server's copy arrives, and whenever it changes
  // underneath us (another tab, say).
  useEffect(() => {
    if (data) setDraft(withSubscriptionDefaults(data))
  }, [data])

  const saved = data ? withSubscriptionDefaults(data) : null
  const isDirty = Boolean(
    draft &&
      saved &&
      [...SUBSCRIPTION_FIELDS, ...COUNT_FIELDS].some(({ key }) => draft[key] !== saved[key])
  )

  return {
    draft,
    setField: (key, value) => setDraft((prev) => (prev ? { ...prev, [key]: value } : prev)),
    isDirty,
    save: async () => {
      if (!draft) throw new Error('Notification subscriptions have not loaded yet')
      return updateMutation.mutateAsync({ userId, subscriptions: draft })
    },
    isLoading,
    isError,
  }
}

export const NotificationSubscriptionFields = ({
  subscriptions,
}: {
  subscriptions: SubscriptionsDraft
}) => {
  const { draft, setField, isLoading, isError } = subscriptions

  if (isLoading) return <Loader message="Loading notification preferences..." />
  if (isError || !draft) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Notification preferences could not be loaded.
      </p>
    )
  }

  return (
    <>
      <FieldSet>
        <FieldLegend variant="label">Notify me about</FieldLegend>
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
      </FieldSet>

      <FieldSet>
        <FieldLegend variant="label">Periodic summaries</FieldLegend>
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
    </>
  )
}
