import { describe, expect, it } from 'vitest'
import type { z } from 'zod'
import { Route } from './new.tsx'

// The route's search schema (`projectId`) is a local, unexported const, so
// it's reached the same way the router itself reaches it: off `Route.options`.
const schema = Route.options.validateSearch as z.ZodType<{ projectId?: number; cloneFrom?: number }>

describe('manage challenge new route search schema', () => {
  it('accepts an empty search (projectId is optional)', () => {
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.projectId).toBeUndefined()
    }
  })

  it('accepts a numeric projectId', () => {
    const result = schema.safeParse({ projectId: 7 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.projectId).toBe(7)
    }
  })

  it('rejects a non-numeric projectId (no coercion configured)', () => {
    const result = schema.safeParse({ projectId: '7' })
    expect(result.success).toBe(false)
  })

  it('accepts a numeric cloneFrom challenge id', () => {
    const result = schema.safeParse({ projectId: 7, cloneFrom: 12 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cloneFrom).toBe(12)
    }
  })
})
