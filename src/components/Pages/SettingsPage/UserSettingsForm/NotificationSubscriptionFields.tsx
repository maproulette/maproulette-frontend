import { useEffect, useMemo, useState } from 'react'
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

const ALL_SUBSCRIPTION_FIELDS = [...SUBSCRIPTION_FIELDS, ...COUNT_FIELDS]

const SUBSCRIPTION_SECTIONS = [
  { legend: 'Notify me about', fields: SUBSCRIPTION_FIELDS, options: subscriptionLevelOptions },
  {
    legend: 'Periodic summaries',
    description: 'These are sent on a schedule rather than when something happens.',
    fields: COUNT_FIELDS,
    options: subscriptionFrequencyOptions,
  },
]

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

  const saved = useMemo(() => (data ? withSubscriptionDefaults(data) : null), [data])

  // Seed the draft once the server's copy arrives, and whenever it changes
  // underneath us (another tab, say).
  useEffect(() => {
    if (saved) setDraft(saved)
  }, [saved])

  const isDirty = Boolean(
    draft && saved && ALL_SUBSCRIPTION_FIELDS.some(({ key }) => draft[key] !== saved[key])
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
      {SUBSCRIPTION_SECTIONS.map(({ legend, description, fields, options }) => (
        <FieldSet key={legend}>
          <FieldLegend variant="label">{legend}</FieldLegend>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <div>
            {fields.map(({ key, label, description: rowDescription }) => (
              <SubscriptionRow
                key={key}
                id={`subscription-${key}`}
                label={label}
                description={rowDescription}
                value={draft[key] as number}
                options={options}
                onChange={(value) => setField(key, value)}
              />
            ))}
          </div>
        </FieldSet>
      ))}
    </>
  )
}
