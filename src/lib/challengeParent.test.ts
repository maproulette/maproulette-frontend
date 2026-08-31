import { describe, expect, it } from 'vitest'
import { getParentId, getParentInfo, withScalarParent } from './challengeParent'

describe('getParentInfo', () => {
  it('extracts id and name from a parent object', () => {
    const result = getParentInfo({ id: 42, name: 'My Project' })
    expect(result).toEqual({ id: 42, name: 'My Project' })
  })

  it('defaults name to "Unknown Project" when the parent object has no name', () => {
    const result = getParentInfo({ id: 42 })
    expect(result).toEqual({ id: 42, name: 'Unknown Project' })
  })

  it('defaults name to "Unknown Project" when the parent object has an empty name', () => {
    const result = getParentInfo({ id: 42, name: '' })
    expect(result).toEqual({ id: 42, name: 'Unknown Project' })
  })

  it('defaults id to null when the parent object has no id', () => {
    const result = getParentInfo({ name: 'Orphan Project' })
    expect(result).toEqual({ id: null, name: 'Orphan Project' })
  })

  it('treats a numeric parent as the id, with an unknown name', () => {
    const result = getParentInfo(10)
    expect(result).toEqual({ id: 10, name: 'Unknown Project' })
  })

  it('treats a string parent as the id, with an unknown name', () => {
    const result = getParentInfo('project-10')
    expect(result).toEqual({ id: 'project-10', name: 'Unknown Project' })
  })

  it('returns null id and unknown name for null parent', () => {
    const result = getParentInfo(null)
    expect(result).toEqual({ id: null, name: 'Unknown Project' })
  })

  it('returns null id and unknown name for undefined parent', () => {
    const result = getParentInfo(undefined)
    expect(result).toEqual({ id: null, name: 'Unknown Project' })
  })

  it('returns null id and unknown name for other malformed input (e.g. a boolean)', () => {
    const result = getParentInfo(true)
    expect(result).toEqual({ id: null, name: 'Unknown Project' })
  })
})

describe('getParentId', () => {
  it('reads the id off an embedded parent project object', () => {
    expect(getParentId({ id: 42, name: 'My Project' })).toBe(42)
  })

  it('passes a numeric parent through', () => {
    expect(getParentId(10)).toBe(10)
  })

  it('coerces a numeric string parent', () => {
    expect(getParentId('10')).toBe(10)
  })

  it('returns undefined for a non-numeric string', () => {
    expect(getParentId('project-10')).toBeUndefined()
  })

  it('returns undefined for a parent object with no id', () => {
    expect(getParentId({ name: 'Orphan Project' })).toBeUndefined()
  })

  it('returns undefined for null, undefined, and other malformed input', () => {
    expect(getParentId(null)).toBeUndefined()
    expect(getParentId(undefined)).toBeUndefined()
    expect(getParentId(true)).toBeUndefined()
  })
})

describe('withScalarParent', () => {
  it('collapses an embedded parent project object to its id', () => {
    const challenge = { id: 1, name: 'C', parent: { id: 42, name: 'My Project' } }
    expect(withScalarParent(challenge)).toEqual({ id: 1, name: 'C', parent: 42 })
  })

  it('returns the same object when parent is already scalar', () => {
    const challenge = { id: 1, name: 'C', parent: 42 }
    expect(withScalarParent(challenge)).toBe(challenge)
  })

  it('returns the same object when parent is missing', () => {
    const challenge = { id: 1, name: 'C' }
    expect(withScalarParent(challenge)).toBe(challenge)
  })

  it('leaves an id-less parent object alone rather than dropping it', () => {
    const challenge = { id: 1, parent: { name: 'Orphan Project' } }
    expect(withScalarParent(challenge)).toBe(challenge)
  })
})
