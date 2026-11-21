export * from './auth'
export * from './keys'

import { userAdmin } from './admin'
import { userAnnouncements } from './announcements'
import { userNotifications } from './notifications'
import { userProfile } from './profile'
import { userSearch } from './search'
import { userSubscriptions } from './subscriptions'

export const user = {
  ...userProfile,
  ...userNotifications,
  ...userAdmin,
  ...userSearch,
  ...userAnnouncements,
  ...userSubscriptions,
}
