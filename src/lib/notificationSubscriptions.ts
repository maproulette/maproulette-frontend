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

export const subscriptionLevelOptions: { value: number; label: MessageDescriptor }[] = [
  {
    value: SUBSCRIPTION_LEVEL.ignore,
    label: defineMessage({
      id: 'notificationSubscriptions.level.ignore',
      defaultMessage: 'Ignore',
    }),
  },
  {
    value: SUBSCRIPTION_LEVEL.noEmail,
    label: defineMessage({
      id: 'notificationSubscriptions.level.noEmail',
      defaultMessage: 'Notify in app',
    }),
  },
  {
    value: SUBSCRIPTION_LEVEL.immediateEmail,
    label: defineMessage({
      id: 'notificationSubscriptions.level.immediateEmail',
      defaultMessage: 'Notify and email immediately',
    }),
  },
  {
    value: SUBSCRIPTION_LEVEL.digestEmail,
    label: defineMessage({
      id: 'notificationSubscriptions.level.digestEmail',
      defaultMessage: 'Notify and include in daily digest',
    }),
  },
]

/** The notification kinds a user can subscribe to, in the order they're shown. */
export const SUBSCRIPTION_FIELDS = [
  {
    key: 'system',
    label: defineMessage({
      id: 'notificationSubscriptions.field.system.label',
      defaultMessage: 'System messages',
    }),
    description: defineMessage({
      id: 'notificationSubscriptions.field.system.description',
      defaultMessage: 'Announcements from MapRoulette itself',
    }),
  },
  {
    key: 'mention',
    label: defineMessage({
      id: 'common.mentions',
      defaultMessage: 'Mentions',
    }),
    description: defineMessage({
      id: 'notificationSubscriptions.field.mention.description',
      defaultMessage: 'When someone @mentions you in a comment',
    }),
  },
  {
    key: 'challengeCompleted',
    label: defineMessage({
      id: 'notificationSubscriptions.field.challengeCompleted.label',
      defaultMessage: 'Challenge completed',
    }),
    description: defineMessage({
      id: 'notificationSubscriptions.field.challengeCompleted.description',
      defaultMessage: 'When a challenge you manage finishes',
    }),
  },
  {
    key: 'team',
    label: defineMessage({
      id: 'common.teams',
      defaultMessage: 'Teams',
    }),
    description: defineMessage({
      id: 'notificationSubscriptions.field.team.description',
      defaultMessage: 'Team invitations and membership changes',
    }),
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
  return filled
}
