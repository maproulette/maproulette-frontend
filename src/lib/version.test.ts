import { describe, expect, it } from 'vitest'
import { frontendVersion } from './version.ts'

describe('frontendVersion', () => {
  it('exposes the build-time app version string', () => {
    expect(typeof frontendVersion).toBe('string')
    expect(frontendVersion.length).toBeGreaterThan(0)
  })
})
