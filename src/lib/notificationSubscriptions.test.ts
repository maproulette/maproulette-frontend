import { describe, expect, it } from 'vitest'
import {
  COUNT_FIELDS,
  SUBSCRIPTION_FIELDS,
  SUBSCRIPTION_FREQUENCY,
  SUBSCRIPTION_LEVEL,
  withSubscriptionDefaults,
} from './notificationSubscriptions.ts'

describe('withSubscriptionDefaults', () => {
  it('defaults every notification kind to in-app only', () => {
    const filled = withSubscriptionDefaults(undefined)
    for (const { key } of SUBSCRIPTION_FIELDS) {
      expect(filled[key]).toBe(SUBSCRIPTION_LEVEL.noEmail)
    }
  })

  it('defaults periodic summaries to off rather than to an unrequested email', () => {
    const filled = withSubscriptionDefaults(undefined)
    for (const { key } of COUNT_FIELDS) {
      expect(filled[key]).toBe(SUBSCRIPTION_FREQUENCY.ignore)
    }
  })

  it('keeps values the server sent, including a deliberate zero', () => {
    const filled = withSubscriptionDefaults({ mention: SUBSCRIPTION_LEVEL.ignore, system: 3 })
    expect(filled.mention).toBe(SUBSCRIPTION_LEVEL.ignore)
    expect(filled.system).toBe(3)
  })

  it('leaves ids alone', () => {
    const filled = withSubscriptionDefaults({ id: 7, userId: 42 })
    expect(filled.id).toBe(7)
    expect(filled.userId).toBe(42)
  })
})

describe('field definitions', () => {
  it('covers every subscription kind the backend accepts, without overlap', () => {
    const keys = [...SUBSCRIPTION_FIELDS, ...COUNT_FIELDS].map((field) => field.key)
    expect(new Set(keys).size).toBe(keys.length)
    expect(keys).toHaveLength(11)
  })
})
