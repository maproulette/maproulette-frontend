import { defineMessage, type MessageDescriptor } from 'react-intl'
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

export const subscriptionLevelOptions: { value: number; label: MessageDescriptor }[] = [
  { value: SUBSCRIPTION_LEVEL.ignore, label: defineMessage({ id: 'notificationSubscriptions.level.ignore', defaultMessage: 'Ignore' }) },
  { value: SUBSCRIPTION_LEVEL.noEmail, label: defineMessage({ id: 'notificationSubscriptions.level.noEmail', defaultMessage: 'Notify in app' }) },
  { value: SUBSCRIPTION_LEVEL.immediateEmail, label: defineMessage({ id: 'notificationSubscriptions.level.immediateEmail', defaultMessage: 'Notify and email immediately' }) },
  { value: SUBSCRIPTION_LEVEL.digestEmail, label: defineMessage({ id: 'notificationSubscriptions.level.digestEmail', defaultMessage: 'Notify and include in daily digest' }) },
]

export const subscriptionFrequencyOptions: { value: number; label: MessageDescriptor }[] = [
  { value: SUBSCRIPTION_FREQUENCY.ignore, label: defineMessage({ id: 'notificationSubscriptions.frequency.ignore', defaultMessage: 'Don\'t send' }) },
  { value: SUBSCRIPTION_FREQUENCY.daily, label: defineMessage({ id: 'notificationSubscriptions.frequency.daily', defaultMessage: 'Daily email' }) },
  { value: SUBSCRIPTION_FREQUENCY.weekly, label: defineMessage({ id: 'notificationSubscriptions.frequency.weekly', defaultMessage: 'Weekly email' }) },
]

/** The notification kinds a user can subscribe to, in the order they're shown. */
export const SUBSCRIPTION_FIELDS = [
  {
    key: 'system',
    label: defineMessage({ id: 'notificationSubscriptions.field.system.label', defaultMessage: 'System messages' }),
    description: defineMessage({ id: 'notificationSubscriptions.field.system.description', defaultMessage: 'Announcements from MapRoulette itself' }),
  },
  {
    key: 'mention',
    label: defineMessage({ id: 'notificationSubscriptions.field.mention.label', defaultMessage: 'Mentions' }),
    description: defineMessage({ id: 'notificationSubscriptions.field.mention.description', defaultMessage: 'When someone @mentions you in a comment' }),
  },
  {
    key: 'reviewApproved',
    label: defineMessage({ id: 'notificationSubscriptions.field.reviewApproved.label', defaultMessage: 'Review approved' }),
    description: defineMessage({ id: 'notificationSubscriptions.field.reviewApproved.description', defaultMessage: 'When a task you completed passes review' }),
  },
  {
    key: 'reviewRejected',
    label: defineMessage({ id: 'notificationSubscriptions.field.reviewRejected.label', defaultMessage: 'Review rejected' }),
    description: defineMessage({ id: 'notificationSubscriptions.field.reviewRejected.description', defaultMessage: 'When a task you completed is rejected' }),
  },
  {
    key: 'reviewAgain',
    label: defineMessage({ id: 'notificationSubscriptions.field.reviewAgain.label', defaultMessage: 'Review requested again' }),
    description: defineMessage({ id: 'notificationSubscriptions.field.reviewAgain.description', defaultMessage: 'When a task needs another look from you' }),
  },
  {
    key: 'metaReview',
    label: defineMessage({ id: 'notificationSubscriptions.field.metaReview.label', defaultMessage: 'Meta review' }),
    description: defineMessage({ id: 'notificationSubscriptions.field.metaReview.description', defaultMessage: 'When one of your reviews is itself reviewed' }),
  },
  {
    key: 'challengeCompleted',
    label: defineMessage({ id: 'notificationSubscriptions.field.challengeCompleted.label', defaultMessage: 'Challenge completed' }),
    description: defineMessage({ id: 'notificationSubscriptions.field.challengeCompleted.description', defaultMessage: 'When a challenge you manage finishes' }),
  },
  {
    key: 'team',
    label: defineMessage({ id: 'notificationSubscriptions.field.team.label', defaultMessage: 'Teams' }),
    description: defineMessage({ id: 'notificationSubscriptions.field.team.description', defaultMessage: 'Team invitations and membership changes' }),
  },
] as const satisfies ReadonlyArray<{
  key: keyof NotificationSubscriptions
  label: MessageDescriptor
  description: MessageDescriptor
}>

/** Count-based notifications, which take a frequency rather than a level. */
export const COUNT_FIELDS = [
  {
    key: 'reviewCount',
    label: defineMessage({ id: 'notificationSubscriptions.field.reviewCount.label', defaultMessage: 'Tasks awaiting your review' }),
    description: defineMessage({ id: 'notificationSubscriptions.field.reviewCount.description', defaultMessage: 'A periodic summary of your review queue' }),
  },
  {
    key: 'revisionCount',
    label: defineMessage({ id: 'notificationSubscriptions.field.revisionCount.label', defaultMessage: 'Tasks awaiting your revision' }),
    description: defineMessage({ id: 'notificationSubscriptions.field.revisionCount.description', defaultMessage: 'A periodic summary of tasks sent back to you' }),
  },
] as const satisfies ReadonlyArray<{
  key: keyof NotificationSubscriptions
  label: MessageDescriptor
  description: MessageDescriptor
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
