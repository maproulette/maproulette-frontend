import type { components } from './openApiTypes'

export const NotificationType = {
  SYSTEM: 0,
  MENTION: 1,
  REVIEW_APPROVED: 2,
  REVIEW_REJECTED: 3,
  REVIEW_AGAIN: 4,
  CHALLENGE_COMPLETED: 5,
  TEAM: 6,
  FOLLOW: 7,
  MAPPER_CHALLENGE_COMPLETED: 8,
  REVIEW_REVISED: 9,
  META_REVIEW: 10,
  META_REVIEW_AGAIN: 11,
  REVIEW_COUNT: 12,
  REVISION_COUNT: 13,
  CHALLENGE_COMMENT: 14,
  CHALLENGE_UNLOCK_REQUESTED: 15,
} as const

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]

export type Notification = components['schemas']['org.maproulette.framework.model.UserNotification']
