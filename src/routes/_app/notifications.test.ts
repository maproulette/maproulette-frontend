import { describe, expect, it } from 'vitest'
import type { z } from 'zod'
import { Route } from './notifications.tsx'

type NotificationsSearch = {
  notificationId?: number
  category?: 'all' | 'task_comment' | 'mention' | 'challenge' | 'team' | 'system'
  status?: 'all' | 'unread' | 'read'
  task?: string
  type?: string
  from?: string
  challenge?: string
  view?: string
}

// The route's search schema is a local, unexported const, so it's reached the
// same way the router itself reaches it: off `Route.options`.
const schema = Route.options.validateSearch as z.ZodType<NotificationsSearch>

describe('notifications route search schema', () => {
  it('accepts an empty search', () => {
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('accepts a fully populated valid search', () => {
    const result = schema.safeParse({
      notificationId: 5,
      category: 'mention',
      status: 'unread',
      task: '123',
      type: '2',
      from: 'someone',
      challenge: '456',
      view: 'list',
    })
    expect(result.success).toBe(true)
  })

  it('coerces a numeric string notificationId to a number', () => {
    const result = schema.safeParse({ notificationId: '5' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.notificationId).toBe(5)
    }
  })

  it('rejects a non-numeric notificationId', () => {
    const result = schema.safeParse({ notificationId: 'not-a-number' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid category value (no catch fallback)', () => {
    const result = schema.safeParse({ category: 'not-a-category' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid status value (no catch fallback)', () => {
    const result = schema.safeParse({ status: 'archived' })
    expect(result.success).toBe(false)
  })

  it('accepts arbitrary strings for the free-form fields', () => {
    const result = schema.safeParse({ task: 'anything', type: 'anything', from: 'anyone' })
    expect(result.success).toBe(true)
  })
})
