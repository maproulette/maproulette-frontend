import type { components } from '@/types/openApiTypes'

export type NotificationSubscriptions =
  components['schemas']['org.maproulette.framework.model.NotificationSubscriptions']

/**
 * How much a user wants to hear about one kind of notification. Values are
 * defined by the server.
 */
export const SUBSCRIPTION_LEVEL = {
  ignore: 0,
  noEmail: 1,
  immediateEmail: 2,
  digestEmail: 3,
} as const

/** Frequency levels, used by the two count-based notifications. */
export const SUBSCRIPTION_FREQUENCY = {
  ignore: 0,
  daily: 5,
  weekly: 6,
} as const

export const subscriptionLevelOptions = [
  { value: SUBSCRIPTION_LEVEL.ignore, label: 'Ignore' },
  { value: SUBSCRIPTION_LEVEL.noEmail, label: 'Notify in app' },
  { value: SUBSCRIPTION_LEVEL.immediateEmail, label: 'Notify and email immediately' },
  { value: SUBSCRIPTION_LEVEL.digestEmail, label: 'Notify and include in daily digest' },
]

export const subscriptionFrequencyOptions = [
  { value: SUBSCRIPTION_FREQUENCY.ignore, label: "Don't send" },
  { value: SUBSCRIPTION_FREQUENCY.daily, label: 'Daily email' },
  { value: SUBSCRIPTION_FREQUENCY.weekly, label: 'Weekly email' },
]

/** The notification kinds a user can subscribe to, in the order they're shown. */
export const SUBSCRIPTION_FIELDS = [
  { key: 'system', label: 'System messages', description: 'Announcements from MapRoulette itself' },
  { key: 'mention', label: 'Mentions', description: 'When someone @mentions you in a comment' },
  {
    key: 'reviewApproved',
    label: 'Review approved',
    description: 'When a task you completed passes review',
  },
  {
    key: 'reviewRejected',
    label: 'Review rejected',
    description: 'When a task you completed is rejected',
  },
  {
    key: 'reviewAgain',
    label: 'Review requested again',
    description: 'When a task needs another look from you',
  },
  {
    key: 'metaReview',
    label: 'Meta review',
    description: 'When one of your reviews is itself reviewed',
  },
  {
    key: 'challengeCompleted',
    label: 'Challenge completed',
    description: 'When a challenge you manage finishes',
  },
  { key: 'team', label: 'Teams', description: 'Team invitations and membership changes' },
  { key: 'follow', label: 'Following', description: 'Activity from mappers you follow' },
] as const satisfies ReadonlyArray<{
  key: keyof NotificationSubscriptions
  label: string
  description: string
}>

/** Count-based notifications, which take a frequency rather than a level. */
export const COUNT_FIELDS = [
  {
    key: 'reviewCount',
    label: 'Tasks awaiting your review',
    description: 'A periodic summary of your review queue',
  },
  {
    key: 'revisionCount',
    label: 'Tasks awaiting your revision',
    description: 'A periodic summary of tasks sent back to you',
  },
] as const satisfies ReadonlyArray<{
  key: keyof NotificationSubscriptions
  label: string
  description: string
}>

/**
 * Fill in anything the server did not send, so every control renders with a
 * defined value. New notification kinds default to in-app only rather than to
 * an email nobody asked for.
 */
export const withSubscriptionDefaults = (
  subscriptions: Partial<NotificationSubscriptions> | undefined
): NotificationSubscriptions => {
  const filled = { ...subscriptions } as NotificationSubscriptions
  for (const { key } of SUBSCRIPTION_FIELDS) {
    if (typeof filled[key] !== 'number') {
      ;(filled as Record<string, number>)[key] = SUBSCRIPTION_LEVEL.noEmail
    }
  }
  for (const { key } of COUNT_FIELDS) {
    if (typeof filled[key] !== 'number') {
      ;(filled as Record<string, number>)[key] = SUBSCRIPTION_FREQUENCY.ignore
    }
  }
  return filled
}
