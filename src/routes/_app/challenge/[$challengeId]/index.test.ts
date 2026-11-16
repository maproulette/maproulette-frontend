import { describe, expect, it } from 'vitest'
import type { z } from 'zod'
import { Route } from './index.tsx'

// The route's search schema is a local, unexported const, so it's reached the
// same way the router itself reaches it: off `Route.options`.
const schema = Route.options.validateSearch as z.ZodType<{ comments?: number; tasks?: string }>

describe('challenge route search schema', () => {
  it('accepts an empty search (comments is optional)', () => {
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.comments).toBeUndefined()
    }
  })

  it('coerces a numeric string comments param to a number', () => {
    const result = schema.safeParse({ comments: '1' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.comments).toBe(1)
    }
  })

  it('accepts a numeric comments param', () => {
    const result = schema.safeParse({ comments: 1 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.comments).toBe(1)
    }
  })

  it('rejects a non-numeric comments param', () => {
    const result = schema.safeParse({ comments: 'not-a-number' })
    expect(result.success).toBe(false)
  })

  it('drops an unknown tasks filter rather than rejecting the URL', () => {
    const result = schema.safeParse({ tasks: 'bogus' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tasks).toBeUndefined()
    }
  })
})
