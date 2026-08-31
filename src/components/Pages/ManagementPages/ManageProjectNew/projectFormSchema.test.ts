import { describe, expect, it } from 'vitest'
import { makeProjectFormSchema, type ProjectFormValues } from './projectFormSchema'

// A fake `t` matching the real IntlContext signature: returns the default
// message when provided (like the real implementation does when a
// translation key is missing from the catalog).
const t = (_id: string, _values?: Record<string, string | number>, defaultMessage?: string) =>
  defaultMessage ?? _id

const validValues: ProjectFormValues = {
  name: 'my-project',
  displayName: 'My Project',
  description: 'A description',
  enabled: true,
  featured: false,
}

describe('makeProjectFormSchema', () => {
  it('accepts a fully valid submission', () => {
    const result = makeProjectFormSchema(t).safeParse(validValues)
    expect(result.success).toBe(true)
  })

  it('accepts an empty description', () => {
    const result = makeProjectFormSchema(t).safeParse({ ...validValues, description: '' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = makeProjectFormSchema(t).safeParse({ ...validValues, name: '' })
    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0].message).toBe(
      'Project name is required'
    )
  })

  it('rejects a name longer than 255 characters', () => {
    const result = makeProjectFormSchema(t).safeParse({
      ...validValues,
      name: 'a'.repeat(256),
    })
    expect(result.success).toBe(false)
  })

  it('rejects an empty displayName', () => {
    const result = makeProjectFormSchema(t).safeParse({ ...validValues, displayName: '' })
    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0].message).toBe(
      'Display name is required'
    )
  })

  it('rejects a displayName longer than 255 characters', () => {
    const result = makeProjectFormSchema(t).safeParse({
      ...validValues,
      displayName: 'a'.repeat(256),
    })
    expect(result.success).toBe(false)
  })

  it('rejects a non-boolean enabled value', () => {
    const result = makeProjectFormSchema(t).safeParse({ ...validValues, enabled: 'yes' })
    expect(result.success).toBe(false)
  })

  it('rejects a non-boolean featured value', () => {
    const result = makeProjectFormSchema(t).safeParse({ ...validValues, featured: 'yes' })
    expect(result.success).toBe(false)
  })

  it('reports every applicable issue at once (multiple blank required fields)', () => {
    const result = makeProjectFormSchema(t).safeParse({
      ...validValues,
      name: '',
      displayName: '',
    })
    expect(result.success).toBe(false)
    if (result.success) return
    const paths = result.error.issues.map((issue) => issue.path.join('.'))
    expect(paths).toEqual(expect.arrayContaining(['name', 'displayName']))
  })
})
