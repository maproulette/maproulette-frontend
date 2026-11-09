import { describe, expect, it } from 'vitest'
import { baseNotification } from '@/test/notificationFixtures'
import {
  getNotificationCategory,
  getNotificationThreadKey,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_CATEGORY_MESSAGES,
  NOTIFICATION_STATUS_MESSAGES,
  NOTIFICATION_STATUSES,
  NOTIFICATION_TYPE_CATEGORY,
  NOTIFICATION_TYPE_NAMES,
  NotificationType,
} from './Notification.ts'

describe('NOTIFICATION_TYPE_NAMES', () => {
  it('provides a name for every notification type', () => {
    for (const value of Object.values(NotificationType)) {
      expect(NOTIFICATION_TYPE_NAMES[value]).toBeTruthy()
    }
  })
})

describe('NOTIFICATION_CATEGORIES', () => {
  it('lists every category label with a matching entry', () => {
    for (const category of NOTIFICATION_CATEGORIES) {
      expect(NOTIFICATION_CATEGORY_MESSAGES[category]).toBeTruthy()
    }
  })
})

describe('NOTIFICATION_STATUSES', () => {
  it('lists every status label with a matching entry', () => {
    for (const status of NOTIFICATION_STATUSES) {
      expect(NOTIFICATION_STATUS_MESSAGES[status]).toBeTruthy()
    }
  })
})

describe('NOTIFICATION_TYPE_CATEGORY', () => {
  it('maps every notification type to a category', () => {
    for (const value of Object.values(NotificationType)) {
      expect(NOTIFICATION_CATEGORIES).toContain(NOTIFICATION_TYPE_CATEGORY[value])
    }
  })
})

describe('getNotificationCategory', () => {
  it('returns system when the notification type is undefined', () => {
    expect(getNotificationCategory(undefined)).toBe('system')
  })

  it('returns the mapped category for a known notification type', () => {
    expect(getNotificationCategory(NotificationType.MENTION)).toBe('mention')
    expect(getNotificationCategory(NotificationType.TEAM)).toBe('team')
    expect(getNotificationCategory(NotificationType.CHALLENGE_COMMENT)).toBe('task_comment')
  })

  it('falls back to system for an unmapped notification type', () => {
    expect(getNotificationCategory(9999)).toBe('system')
    expect(getNotificationCategory(NotificationType.REVIEW_APPROVED)).toBe('system')
  })
})

describe('getNotificationThreadKey', () => {
  it('groups by task id when present', () => {
    const notification = { ...baseNotification(), taskId: 42 }

    expect(getNotificationThreadKey(notification)).toBe('task:42')
  })

  it('prefers task id over challenge comment grouping', () => {
    const notification = {
      ...baseNotification(),
      taskId: 42,
      notificationType: NotificationType.CHALLENGE_COMMENT,
      challengeId: 7,
    }

    expect(getNotificationThreadKey(notification)).toBe('task:42')
  })

  it('groups challenge comments without a task id by challenge id', () => {
    const notification = {
      ...baseNotification(),
      notificationType: NotificationType.CHALLENGE_COMMENT,
      challengeId: 7,
    }

    expect(getNotificationThreadKey(notification)).toBe('challenge:7')
  })

  it('does not use challenge grouping when challengeId is missing', () => {
    const notification = {
      ...baseNotification(),
      notificationType: NotificationType.CHALLENGE_COMMENT,
    }

    expect(getNotificationThreadKey(notification)).toBe('single:1')
  })

  it('groups team notifications by target id', () => {
    const notification = {
      ...baseNotification(),
      notificationType: NotificationType.TEAM,
      targetId: 99,
    }

    expect(getNotificationThreadKey(notification)).toBe('team:99')
  })

  it('does not use team grouping when targetId is missing', () => {
    const notification = {
      ...baseNotification(),
      notificationType: NotificationType.TEAM,
    }

    expect(getNotificationThreadKey(notification)).toBe('single:1')
  })

  it('falls back to challenge name when no ids are present', () => {
    const notification = { ...baseNotification(), challengeName: 'Fix the roads' }

    expect(getNotificationThreadKey(notification)).toBe('challenge-name:Fix the roads')
  })

  it('falls back to the notification id as a single-item thread', () => {
    expect(getNotificationThreadKey(baseNotification())).toBe('single:1')
  })
})
