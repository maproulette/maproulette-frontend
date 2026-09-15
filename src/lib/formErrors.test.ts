import { describe, expect, it } from 'vitest'
import { flattenFieldErrors } from './formErrors'

describe('flattenFieldErrors', () => {
  it('lists each field error with its path', () => {
    expect(
      flattenFieldErrors({
        name: { type: 'too_small', message: 'A name is required' },
        localGeoJSON: { type: 'custom', message: 'A GeoJSON file is required' },
      })
    ).toEqual([
      { name: 'name', message: 'A name is required' },
      { name: 'localGeoJSON', message: 'A GeoJSON file is required' },
    ])
  })

  it('reaches errors on nested fields', () => {
    expect(
      flattenFieldErrors({
        priorityRules: [{ value: { type: 'custom', message: 'A value is required' } }],
      } as never)
    ).toEqual([{ name: 'priorityRules.0.value', message: 'A value is required' }])
  })

  it('leaves out form-level root errors, which are shown separately', () => {
    expect(
      flattenFieldErrors({
        root: { serverError: { type: 'server', message: 'Server said no' } },
        name: { type: 'custom', message: 'A name is required' },
      } as never)
    ).toEqual([{ name: 'name', message: 'A name is required' }])
  })

  it('is empty for a form with nothing wrong', () => {
    expect(flattenFieldErrors({})).toEqual([])
  })
})
