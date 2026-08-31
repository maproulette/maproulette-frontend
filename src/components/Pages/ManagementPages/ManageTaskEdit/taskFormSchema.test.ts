import { describe, expect, it } from 'vitest'
import { type TaskFormValues, taskFormSchema } from './taskFormSchema'

const validValues: TaskFormValues = {
  name: 'A valid name',
  instruction: 'Some instructions',
  geometries: '{"type":"Point","coordinates":[0,0]}',
  status: 0,
  errorTags: '',
}

describe('taskFormSchema', () => {
  it('accepts a fully valid submission', () => {
    const result = taskFormSchema.safeParse(validValues)
    expect(result.success).toBe(true)
  })

  it('accepts an empty instruction', () => {
    const result = taskFormSchema.safeParse({ ...validValues, instruction: '' })
    expect(result.success).toBe(true)
  })

  it('accepts an empty errorTags', () => {
    const result = taskFormSchema.safeParse({ ...validValues, errorTags: '' })
    expect(result.success).toBe(true)
  })

  it('rejects a name shorter than 3 characters', () => {
    const result = taskFormSchema.safeParse({ ...validValues, name: 'ab' })
    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0].message).toBe(
      'Name must be at least 3 characters'
    )
  })

  it('rejects an empty geometries string', () => {
    const result = taskFormSchema.safeParse({ ...validValues, geometries: '' })
    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0].message).toBe('GeoJSON is required')
  })

  it('rejects a geometries string that is not valid JSON', () => {
    const result = taskFormSchema.safeParse({ ...validValues, geometries: '{not valid json' })
    expect(result.success).toBe(false)
    expect(result.success ? undefined : result.error.issues[0].message).toBe(
      'GeoJSON must be valid JSON'
    )
  })

  it('accepts any valid JSON in geometries, not just GeoJSON shapes', () => {
    const result = taskFormSchema.safeParse({ ...validValues, geometries: '{"foo":"bar"}' })
    expect(result.success).toBe(true)
  })

  it('rejects a negative status', () => {
    const result = taskFormSchema.safeParse({ ...validValues, status: -1 })
    expect(result.success).toBe(false)
  })

  it('rejects a non-integer status', () => {
    const result = taskFormSchema.safeParse({ ...validValues, status: 1.5 })
    expect(result.success).toBe(false)
  })

  it('reports every applicable issue at once (multiple invalid fields)', () => {
    const result = taskFormSchema.safeParse({
      ...validValues,
      name: 'ab',
      geometries: '',
      status: -1,
    })
    expect(result.success).toBe(false)
    if (result.success) return
    const paths = result.error.issues.map((issue) => issue.path.join('.'))
    expect(paths).toEqual(expect.arrayContaining(['name', 'geometries', 'status']))
  })
})
