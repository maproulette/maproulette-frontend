// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { localStored, sessionStored } from './storage'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
  sessionStorage.clear()
})

describe('localStored', () => {
  it('returns the fallback when nothing is stored', () => {
    expect(localStored('test.missing', z.boolean(), true).get()).toBe(true)
  })

  it('round-trips a value under a namespaced key', () => {
    const store = localStored('test.roundTrip', z.object({ x: z.number() }), null)
    store.set({ x: 3 })
    expect(store.get()).toEqual({ x: 3 })
    expect(localStorage.getItem('mr.test.roundTrip')).toBe('{"x":3}')
  })

  it('returns the fallback for a value that fails the schema', () => {
    localStorage.setItem('mr.test.invalid', '"purple"')
    expect(localStored('test.invalid', z.enum(['light', 'dark']), 'light').get()).toBe('light')
  })

  it('returns the fallback for a value that is not JSON', () => {
    localStorage.setItem('mr.test.notJson', 'dark')
    expect(localStored('test.notJson', z.string(), 'light').get()).toBe('light')
  })

  it('keeps a value for the page load when storage refuses the write', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota', 'QuotaExceededError')
    })
    const store = localStored('test.refused', z.number(), 0)
    store.set(7)
    expect(store.get()).toBe(7)
  })

  it('returns the fallback when storage is blocked entirely', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError')
    })
    expect(localStored('test.blocked', z.number(), 1).get()).toBe(1)
  })
})

describe('sessionStored', () => {
  it('uses sessionStorage, separately from localStorage', () => {
    sessionStored('test.area', z.number(), 0).set(2)
    expect(sessionStorage.getItem('mr.test.area')).toBe('2')
    expect(localStored('test.area', z.number(), 0).get()).toBe(0)
  })
})
