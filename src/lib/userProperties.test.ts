import { describe, expect, it, vi } from 'vitest'
import type { UserProperties } from '@/types/User'
import { getAppSetting, withAppSetting } from './userProperties'

const APP_ID = 'MR4'

const userProperties = (): UserProperties => ({
  MR4: {
    settings: {
      preference_a: 'Hello',
      preference_b: 'World',
      undefined_preference: undefined,
      false_preference: false,
      zero_preference: 0,
      blank_preference: '',
    },
    meta: {
      revision: new Date('2025-01-01T00:00:00Z'),
      id: 'abc123',
    },
  },
  MR3: {
    settings: {
      unrelated_preference: 'Unrelated',
    },
  },
})

const userPropertiesNoSettings = (): UserProperties => ({
  MR4: {
    meta: {},
  },
})

const blankUserProperties = (): UserProperties => ({})

describe('getAppSetting', () => {
  it('reads the user properties', () => {
    expect(getAppSetting(userProperties(), APP_ID, 'preference_a')).toBe('Hello')
  })

  it('returns undefined for invalid user property', () => {
    expect(getAppSetting(userProperties(), APP_ID, 'preference_c')).toBeUndefined()
  })

  it('returns undefined for undefined properties', () => {
    expect(getAppSetting(userProperties(), APP_ID, 'undefined_preference')).toBeUndefined()
  })

  it('returns undefined for appId that does not exist', () => {
    expect(getAppSetting(userProperties(), 'invalid_app_id', 'preference_a')).toBeUndefined()
  })

  it('returns undefined for user properties with no settings object', () => {
    expect(getAppSetting(userPropertiesNoSettings(), APP_ID, 'preference_a')).toBeUndefined()
  })

  it('returns correct values for falsy stored values', () => {
    expect(getAppSetting(userProperties(), APP_ID, 'false_preference')).toBe(false)
    expect(getAppSetting(userProperties(), APP_ID, 'zero_preference')).toBe(0)
    expect(getAppSetting(userProperties(), APP_ID, 'blank_preference')).toBe('')
  })
})

describe('withAppSetting', () => {
  it('returns user properties with new key/value appended', () => {
    const newProperties = withAppSetting(userProperties(), APP_ID, 'preference_c', 'OpenStreetMap')
    expect(getAppSetting(newProperties, APP_ID, 'preference_c')).toBe('OpenStreetMap')
  })

  it('returns user properties with revision updated', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const newProperties = withAppSetting(userProperties(), APP_ID, 'preference_c', 'OpenStreetMap')
    expect((newProperties[APP_ID] as { meta: { revision: number } }).meta.revision).toBe(
      new Date('2026-01-01T00:00:00Z').getTime()
    )
    vi.useRealTimers()
  })

  it('overwrites existing settings keys', () => {
    const newProperties = withAppSetting(userProperties(), APP_ID, 'preference_a', 'Hi')
    expect(
      (newProperties[APP_ID] as { settings: Record<string, unknown> }).settings.preference_a
    ).toBe('Hi')
  })

  it('retains other settings when one setting is updated', () => {
    const newProperties = withAppSetting(userProperties(), APP_ID, 'preference_c', 'OpenStreetMap')
    expect(getAppSetting(newProperties, APP_ID, 'preference_a')).toBe('Hello')
  })

  it('does not affect other apps settings when updating setting', () => {
    const newProperties = withAppSetting(userProperties(), APP_ID, 'preference_c', 'OpenStreetMap')
    expect(getAppSetting(newProperties, 'MR3', 'unrelated_preference')).toBe('Unrelated')
  })

  it('leaves other meta fields untouched when updating revision', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    const newProperties = withAppSetting(userProperties(), APP_ID, 'preference_c', 'OpenStreetMap')
    expect((newProperties[APP_ID] as { meta: { id: string } }).meta.id).toBe('abc123')
    vi.useRealTimers()
  })

  it('creates settings structure if no structure exists', () => {
    const newProperties = withAppSetting(blankUserProperties(), APP_ID, 'preference_a', 'Hello')
    expect(getAppSetting(newProperties, APP_ID, 'preference_a')).toBe('Hello')
  })

  it('does not mutate the input properties', () => {
    const original = userProperties()
    const snapshot = structuredClone(original)

    const result = withAppSetting(original, APP_ID, 'preference_a', 'Changed')

    expect(original).toEqual(snapshot)
    expect(result).not.toBe(original)
    expect(result[APP_ID]).not.toBe(original[APP_ID])
  })
})
