import { describe, expect, it } from 'vitest'
import type { Task } from '@/types/Task'
import {
  getMergedFeatureProperties,
  replacePropertyTags,
  substituteTaskProperties,
} from './propertyUtils.ts'

const makeTask = (features: GeoJSON.Feature[]): Task =>
  ({
    id: 1,
    geometries: { type: 'FeatureCollection', features },
  }) as Task

const feature = (properties: Record<string, unknown> | null): GeoJSON.Feature => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [0, 0] },
  properties,
})

describe('getMergedFeatureProperties', () => {
  it('returns null when the task has no features', () => {
    expect(getMergedFeatureProperties(makeTask([]))).toBeNull()
  })

  it('returns null when every feature has no properties', () => {
    expect(getMergedFeatureProperties(makeTask([feature(null)]))).toBeNull()
  })

  it('returns the properties of a single feature', () => {
    const task = makeTask([feature({ name: 'Main St' })])
    expect(getMergedFeatureProperties(task)).toEqual({ name: 'Main St' })
  })

  it('merges properties across multiple features', () => {
    const task = makeTask([feature({ name: 'Main St' }), feature({ highway: 'residential' })])
    expect(getMergedFeatureProperties(task)).toEqual({
      name: 'Main St',
      highway: 'residential',
    })
  })

  it('lets later features win on key collisions', () => {
    const task = makeTask([feature({ name: 'First' }), feature({ name: 'Second' })])
    expect(getMergedFeatureProperties(task)).toEqual({ name: 'Second' })
  })

  it('skips features with null properties while still merging the rest', () => {
    const task = makeTask([feature(null), feature({ name: 'Main St' })])
    expect(getMergedFeatureProperties(task)).toEqual({ name: 'Main St' })
  })
})

describe('replacePropertyTags', () => {
  it('replaces a single {{key}} tag with its value', () => {
    expect(replacePropertyTags('Fix the {{name}}', { name: 'Main St' })).toBe('Fix the Main St')
  })

  it('replaces multiple distinct tags', () => {
    const result = replacePropertyTags('{{name}} is a {{highway}}', {
      name: 'Main St',
      highway: 'residential',
    })
    expect(result).toBe('Main St is a residential')
  })

  it('replaces every occurrence of a repeated tag', () => {
    const result = replacePropertyTags('{{name}} equals {{name}}', { name: 'Main St' })
    expect(result).toBe('Main St equals Main St')
  })

  it('leaves unmatched tags untouched', () => {
    const result = replacePropertyTags('{{name}} and {{missing}}', { name: 'Main St' })
    expect(result).toBe('Main St and {{missing}}')
  })

  it('stringifies non-string values', () => {
    const result = replacePropertyTags('lanes: {{lanes}}', { lanes: 3 })
    expect(result).toBe('lanes: 3')
  })

  it('returns the original text unchanged when there are no properties', () => {
    expect(replacePropertyTags('no tags here', {})).toBe('no tags here')
  })

  it('URI-encodes values when encode is true', () => {
    const result = replacePropertyTags('search?q={{name}}', { name: 'Main St & Co' }, true)
    expect(result).toBe('search?q=Main%20St%20%26%20Co')
  })

  it('does not encode values when encode is false (default)', () => {
    const result = replacePropertyTags('search?q={{name}}', { name: 'Main St & Co' })
    expect(result).toBe('search?q=Main St & Co')
  })
})

describe('substituteTaskProperties', () => {
  it('returns the original text unchanged when the task has no properties', () => {
    const task = makeTask([])
    expect(substituteTaskProperties('Fix the {{name}}', task)).toBe('Fix the {{name}}')
  })

  it('substitutes tags using the task feature properties', () => {
    const task = makeTask([feature({ name: 'Main St' })])
    expect(substituteTaskProperties('Fix the {{name}}', task)).toBe('Fix the Main St')
  })

  it('substitutes using properties merged across all of the task features', () => {
    const task = makeTask([feature({ name: 'Main St' }), feature({ highway: 'residential' })])
    expect(substituteTaskProperties('{{name}} is a {{highway}}', task)).toBe(
      'Main St is a residential'
    )
  })
})
