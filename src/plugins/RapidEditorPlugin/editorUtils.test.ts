// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { getOSMToken } from './editorUtils'

describe('getOSMToken', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('returns the stored token', () => {
    localStorage.setItem('osm_token', 'abc123')
    expect(getOSMToken()).toBe('abc123')
  })

  it('returns null when no token is stored', () => {
    expect(getOSMToken()).toBeNull()
  })
})
