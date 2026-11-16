import type { Notification } from '@/types/Notification'
import { NotificationType } from '@/types/Notification'

/** A minimal valid Notification, overridable per test. */
export function baseNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 1,
    userId: 1,
    notificationType: NotificationType.SYSTEM,
    created: 0,
    modified: 0,
    isRead: false,
    emailStatus: 0,
    errorTags: '',
    ...overrides,
  }
}
