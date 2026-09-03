import { describe, expect, it } from 'vitest'
import type { z } from 'zod'
import { Route } from './index.tsx'

// The route's search schema (`tab`) is a local, unexported const, so it's
// reached the same way the router itself reaches it: off `Route.options`.
const schema = Route.options.validateSearch as z.ZodType<{
  tab?: 'task' | 'data' | 'comments'
}>

describe('task route search schema', () => {
  it('accepts an empty search (tab is optional)', () => {
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tab).toBeUndefined()
    }
  })

  it.each(['task', 'data', 'comments'] as const)('accepts the %s tab value', (tab) => {
    const result = schema.safeParse({ tab })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tab).toBe(tab)
    }
  })

  it('rejects an unrecognized tab value', () => {
    const result = schema.safeParse({ tab: 'history' })
    expect(result.success).toBe(false)
  })
})
