import { describe, expect, it } from 'vitest'
import { user } from './index'

describe('user barrel export', () => {
  it('re-exports the auth API', () => {
    expect(typeof user.signOut).toBe('function')
    expect(typeof user.callback).toBe('function')
    expect(typeof user.whoAmI).toBe('function')
    expect(typeof user.whoAmIOptions).toBe('function')
    expect(typeof user.refreshAuth).toBe('function')
    expect(typeof user.clearAuth).toBe('function')
  })

  it('re-exports the profile API', () => {
    expect(typeof user.getUser).toBe('function')
    expect(typeof user.activity).toBe('function')
    expect(typeof user.metrics).toBe('function')
    expect(typeof user.topChallenges).toBe('function')
    expect(typeof user.savedChallenges).toBe('function')
    expect(typeof user.savedTasks).toBe('function')
    expect(typeof user.lockedTasks).toBe('function')
    expect(typeof user.teamMemberships).toBe('function')
    expect(typeof user.useUpdateUserSettings).toBe('function')
  })

  it('re-exports the notifications API', () => {
    expect(typeof user.notification).toBe('function')
    expect(typeof user.useMarkNotificationsAsRead).toBe('function')
    expect(typeof user.useMarkNotificationsAsUnread).toBe('function')
    expect(typeof user.useDeleteNotifications).toBe('function')
  })

  it('re-exports the admin API', () => {
    expect(typeof user.getAllUsers).toBe('function')
    expect(typeof user.getSuperUsers).toBe('function')
  })

  it('re-exports the search API', () => {
    expect(typeof user.findUsers).toBe('function')
  })
})
