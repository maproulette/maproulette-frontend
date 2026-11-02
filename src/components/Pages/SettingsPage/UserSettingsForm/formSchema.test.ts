import { describe, expect, it } from 'vitest'
import type { UserSettings } from '@/types/User'
import { basemapSettings, formSchema, getDefaultValues } from './formSchema.ts'

const validInput = {
  defaultEditor: 1,
  defaultBasemap: 'MAPNIK',
  defaultBasemapId: 'custom-basemap-id',
  locale: 'en-US',
  email: 'user@example.com',
  emailOptIn: true,
  leaderboardOptOut: false,
  theme: 1,
  disableTaskConfirm: false,
}

describe('formSchema', () => {
  it('accepts a fully populated valid input', () => {
    const result = formSchema.safeParse(validInput)
    expect(result.success).toBe(true)
  })

  it('accepts the minimal input with only the required field set', () => {
    const result = formSchema.safeParse({ defaultBasemap: -1 })
    expect(result.success).toBe(true)
  })

  it('rejects input missing the required defaultBasemap field', () => {
    const { defaultBasemap: _defaultBasemap, ...rest } = validInput
    const result = formSchema.safeParse(rest)
    expect(result.success).toBe(false)
  })

  it('rejects a defaultEditor value not present in editorOptions', () => {
    const result = formSchema.safeParse({ ...validInput, defaultEditor: 999 })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === 'Invalid editor option')).toBe(
        true
      )
    }
  })

  it('accepts every documented editor option value', () => {
    for (const value of [-1, 0, 1, 2, 3, 4, 5]) {
      const result = formSchema.safeParse({ ...validInput, defaultEditor: value })
      expect(result.success).toBe(true)
    }
  })

  it('rejects a defaultBasemap value not present in baseMapOptions', () => {
    const result = formSchema.safeParse({ ...validInput, defaultBasemap: 'NotARealBasemap' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === 'Invalid basemap option')).toBe(
        true
      )
    }
  })

  it('accepts both numeric and string basemap option values', () => {
    expect(formSchema.safeParse({ ...validInput, defaultBasemap: -1 }).success).toBe(true)
    expect(formSchema.safeParse({ ...validInput, defaultBasemap: 'Bing' }).success).toBe(true)
  })

  it('rejects a locale value not present in localeOptions', () => {
    const result = formSchema.safeParse({ ...validInput, locale: 'xx-XX' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.message === 'Invalid language option')).toBe(
        true
      )
    }
  })

  it('omits the optional locale field without failing', () => {
    const { locale: _locale, ...rest } = validInput
    const result = formSchema.safeParse(rest)
    expect(result.success).toBe(true)
  })

  it('accepts a well-formed email address', () => {
    const result = formSchema.safeParse({ ...validInput, email: 'someone@maproulette.org' })
    expect(result.success).toBe(true)
  })

  it('accepts an empty string for email', () => {
    const result = formSchema.safeParse({ ...validInput, email: '' })
    expect(result.success).toBe(true)
  })

  it('rejects a malformed email address', () => {
    const result = formSchema.safeParse({ ...validInput, email: 'not-an-email' })
    expect(result.success).toBe(false)
  })

  it('accepts opaque plugin settings fields via loose schema', () => {
    const result = formSchema.safeParse({
      ...validInput,
      pluginNumber: -1,
      pluginEnabled: true,
      pluginNote: 'anything',
    })
    expect(result.success).toBe(true)
  })

  it('preserves opaque plugin settings fields in the parse output', () => {
    const result = formSchema.safeParse({ ...validInput, pluginNumber: 0 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.pluginNumber).toBe(0)
    }
  })

  it('rejects a theme value below the minimum', () => {
    const result = formSchema.safeParse({ ...validInput, theme: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects a theme value above the maximum', () => {
    const result = formSchema.safeParse({ ...validInput, theme: 3 })
    expect(result.success).toBe(false)
  })

  it('accepts theme values at the boundaries', () => {
    expect(formSchema.safeParse({ ...validInput, theme: 0 }).success).toBe(true)
    expect(formSchema.safeParse({ ...validInput, theme: 2 }).success).toBe(true)
  })

  it('rejects a non-boolean value for a boolean field', () => {
    const result = formSchema.safeParse({ ...validInput, emailOptIn: 'yes' })
    expect(result.success).toBe(false)
  })
})

describe('getDefaultValues', () => {
  const settingsWithLocale = (locale?: string) => ({ locale }) as unknown as UserSettings

  it('prefills a supported saved locale', () => {
    expect(getDefaultValues(settingsWithLocale('fr'), 'de').locale).toBe('fr')
  })

  it('normalizes a legacy "en" saved locale to en-US', () => {
    expect(getDefaultValues(settingsWithLocale('en'), 'de').locale).toBe('en-US')
  })

  it.each(['xx-XX', undefined])(
    'falls back to the active locale when the saved locale is %s',
    (locale) => {
      expect(getDefaultValues(settingsWithLocale(locale), 'de').locale).toBe('de')
    }
  )

  it.each(['en', 'xx-XX', 'cs-CZ', undefined])(
    'produces values that pass validation when the saved locale is %s',
    (locale) => {
      const result = formSchema.safeParse(getDefaultValues(settingsWithLocale(locale), 'en-US'))
      expect(result.success).toBe(true)
    }
  )

  it('falls back to the documented defaults for unset fields', () => {
    expect(getDefaultValues(settingsWithLocale(), 'en-US')).toEqual({
      defaultEditor: -1,
      defaultBasemap: -1,
      defaultBasemapId: '',
      email: '',
      locale: 'en-US',
    })
  })
})

describe('user basemap settings', () => {
  const settings = (overrides: Partial<UserSettings>) => overrides as UserSettings

  it('loads an MR3 imagery-index basemap as its option', () => {
    const values = getDefaultValues(
      settings({ defaultBasemap: 4, defaultBasemapId: 'Bing' }),
      'en-US'
    )
    expect(values.defaultBasemap).toBe('Bing')
    expect(values.defaultBasemapId).toBe('')
    expect(formSchema.safeParse(values).success).toBe(true)
  })

  it('loads the MR3 numeric constants as their imagery-index options', () => {
    expect(getDefaultValues(settings({ defaultBasemap: 0 }), 'en-US').defaultBasemap).toBe('MAPNIK')
    expect(getDefaultValues(settings({ defaultBasemap: 2 }), 'en-US').defaultBasemap).toBe('Bing')
  })

  it('keeps a stored basemap that has no option without blocking the save', () => {
    const stored = settings({ defaultBasemap: 4, defaultBasemapId: 'My Custom Layer' })
    const values = getDefaultValues(stored, 'en-US')
    expect(values.defaultBasemap).toBe('current')
    expect(formSchema.safeParse(values).success).toBe(true)
    expect(basemapSettings(values, stored)).toEqual({
      defaultBasemap: 4,
      defaultBasemapId: 'My Custom Layer',
    })
  })

  it('writes the stored values back when the basemap was not changed', () => {
    const stored = settings({ defaultBasemap: 2 })
    expect(basemapSettings(getDefaultValues(stored, 'en-US'), stored)).toEqual({
      defaultBasemap: 2,
      defaultBasemapId: undefined,
    })
  })

  it('stores a picked layer the way MR3 did', () => {
    const stored = settings({ defaultBasemap: -1 })
    const values = { ...getDefaultValues(stored, 'en-US'), defaultBasemap: 'EsriWorldImagery' }
    expect(basemapSettings(values, stored)).toEqual({
      defaultBasemap: 4,
      defaultBasemapId: 'EsriWorldImagery',
    })
    expect(
      basemapSettings(
        { ...values, defaultBasemap: -1 },
        settings({ defaultBasemap: 4, defaultBasemapId: 'Bing' })
      )
    ).toEqual({
      defaultBasemap: -1,
      defaultBasemapId: '',
    })
  })
})
