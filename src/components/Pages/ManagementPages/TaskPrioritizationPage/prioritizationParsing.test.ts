import { describe, expect, it } from 'vitest'
import type { BinaryLeaf } from '@/components/shared/TaskPropertyQueryBuilder/propertyRuleTypes'
import { TaskPriority } from '@/types/Priority'
import type { PrioritizationDraft } from './PrioritizationContext'
import { draftsEqual, parseBoundsString, parseRulesString } from './prioritizationParsing'

const emptyTier = { rules: null, bounds: null }

const baseDraft = (overrides: Partial<PrioritizationDraft> = {}): PrioritizationDraft => ({
  defaultPriority: TaskPriority.MEDIUM,
  high: { ...emptyTier },
  medium: { ...emptyTier },
  low: { ...emptyTier },
  ...overrides,
})

const sampleFeature: GeoJSON.Feature = {
  type: 'Feature',
  properties: {},
  geometry: { type: 'Point', coordinates: [1, 2] },
}

describe('parseBoundsString', () => {
  it('returns null for null/undefined input', () => {
    expect(parseBoundsString(null)).toBeNull()
    expect(parseBoundsString(undefined)).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(parseBoundsString('')).toBeNull()
  })

  it('parses a JSON-stringified FeatureCollection (current format)', () => {
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [sampleFeature] }
    expect(parseBoundsString(JSON.stringify(fc))).toEqual(fc)
  })

  it('parses an already-parsed FeatureCollection object', () => {
    const fc: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [sampleFeature] }
    expect(parseBoundsString(fc)).toEqual(fc)
  })

  it('wraps a single parsed Feature object into a FeatureCollection', () => {
    expect(parseBoundsString(sampleFeature)).toEqual({
      type: 'FeatureCollection',
      features: [sampleFeature],
    })
  })

  it('wraps a JSON-stringified single Feature into a FeatureCollection', () => {
    expect(parseBoundsString(JSON.stringify(sampleFeature))).toEqual({
      type: 'FeatureCollection',
      features: [sampleFeature],
    })
  })

  it('parses a legacy MR3 feature-array format into a FeatureCollection', () => {
    expect(parseBoundsString(JSON.stringify([sampleFeature]))).toEqual({
      type: 'FeatureCollection',
      features: [sampleFeature],
    })
  })

  it('parses an already-parsed legacy feature array', () => {
    expect(parseBoundsString([sampleFeature])).toEqual({
      type: 'FeatureCollection',
      features: [sampleFeature],
    })
  })

  it('returns null for an empty legacy feature array', () => {
    expect(parseBoundsString([])).toBeNull()
    expect(parseBoundsString('[]')).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    expect(parseBoundsString('{not valid json')).toBeNull()
  })

  it('returns null for a well-formed object of an unrecognized shape', () => {
    expect(parseBoundsString({ type: 'SomethingElse', features: [] })).toBeNull()
    expect(parseBoundsString({ foo: 'bar' })).toBeNull()
  })

  it('returns null for a JSON value that parses to a primitive', () => {
    expect(parseBoundsString('42')).toBeNull()
    expect(parseBoundsString('"just a string"')).toBeNull()
  })
})

describe('parseRulesString', () => {
  const backendLeaf = { value: 'surface. ', type: 'string', operator: 'is_empty' }
  const backendGroup = {
    condition: 'AND',
    rules: [
      { value: 'surface.paved', type: 'string', operator: 'equal' },
      { value: 'lanes.2', type: 'double', operator: '==' },
    ],
  }

  it('returns null for null/undefined input', () => {
    expect(parseRulesString(null)).toBeNull()
    expect(parseRulesString(undefined)).toBeNull()
  })

  it('returns null for empty input (empty string or "{}")', () => {
    expect(parseRulesString('')).toBeNull()
    expect(parseRulesString('   ')).toBeNull()
    expect(parseRulesString('{}')).toBeNull()
  })

  it('parses a JSON-stringified backend rule group (current format) into a BinaryNode tree', () => {
    const result = parseRulesString(JSON.stringify(backendGroup))
    expect(result).toEqual({
      valueType: 'compound rule',
      condition: 'and',
      left: { key: 'surface', value: 'paved', operator: 'equals' },
      right: { key: 'lanes', value: '2', operator: 'equals', valueType: 'number' },
    })
  })

  it('parses an already-parsed backend rule object', () => {
    const result = parseRulesString(backendGroup)
    expect(result).not.toBeNull()
    expect((result as { condition: string }).condition).toBe('and')
  })

  it('parses a single backend leaf into a BinaryLeaf, restoring the empty-value placeholder', () => {
    const result = parseRulesString(backendLeaf) as BinaryLeaf
    expect(result).toEqual({ key: 'surface', value: '', operator: 'missing' })
  })

  it('passes through an already-BinaryNode-shaped legacy draft untouched', () => {
    const legacyLeaf: BinaryLeaf = { key: 'surface', value: 'paved', operator: 'equals' }
    expect(parseRulesString(legacyLeaf)).toEqual(legacyLeaf)
  })

  it('returns null for malformed JSON', () => {
    expect(parseRulesString('{not valid json')).toBeNull()
  })

  it('returns null for a recognized-shape object with no usable rules', () => {
    expect(parseRulesString({ condition: 'AND', rules: [] })).toBeNull()
  })

  it('returns null for an unrecognized object shape', () => {
    expect(parseRulesString({ foo: 'bar' })).toBeNull()
    expect(parseRulesString('42')).toBeNull()
  })
})

describe('draftsEqual', () => {
  it('returns true for two identical empty drafts', () => {
    expect(draftsEqual(baseDraft(), baseDraft())).toBe(true)
  })

  it('returns true for deeply-equal (but distinct object references) drafts', () => {
    const rules: BinaryLeaf = { key: 'surface', value: 'paved', operator: 'equals' }
    const bounds: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] }
    const a = baseDraft({ high: { rules: { ...rules }, bounds: { ...bounds } } })
    const b = baseDraft({ high: { rules: { ...rules }, bounds: { ...bounds } } })
    expect(draftsEqual(a, b)).toBe(true)
  })

  it('returns false when defaultPriority differs', () => {
    const a = baseDraft({ defaultPriority: TaskPriority.HIGH })
    const b = baseDraft({ defaultPriority: TaskPriority.LOW })
    expect(draftsEqual(a, b)).toBe(false)
  })

  it('returns false when a tier rules differ', () => {
    const a = baseDraft({
      high: { rules: { key: 'surface', value: 'paved', operator: 'equals' }, bounds: null },
    })
    const b = baseDraft()
    expect(draftsEqual(a, b)).toBe(false)
  })

  it('returns false when a tier bounds differ', () => {
    const a = baseDraft({
      low: { rules: null, bounds: { type: 'FeatureCollection', features: [sampleFeature] } },
    })
    const b = baseDraft()
    expect(draftsEqual(a, b)).toBe(false)
  })

  it('treats null rules/bounds as equal to another null rules/bounds (not equal to a populated tier)', () => {
    const nullDraft = baseDraft()
    const populatedDraft = baseDraft({
      medium: { rules: null, bounds: { type: 'FeatureCollection', features: [] } },
    })
    expect(draftsEqual(nullDraft, nullDraft)).toBe(true)
    expect(draftsEqual(nullDraft, populatedDraft)).toBe(false)
  })

  it('is sensitive to key order in nested objects (JSON.stringify-based comparison)', () => {
    const point: GeoJSON.Point = { type: 'Point', coordinates: [1, 2] }
    const a = baseDraft({
      high: {
        rules: null,
        bounds: {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: { a: 1, b: 2 }, geometry: point }],
        },
      },
    })
    const b = baseDraft({
      high: {
        rules: null,
        bounds: {
          type: 'FeatureCollection',
          features: [{ type: 'Feature', properties: { b: 2, a: 1 }, geometry: point }],
        },
      },
    })
    // Documents the current implementation's behavior: comparison is
    // JSON.stringify-based, so differing key order is treated as unequal.
    expect(draftsEqual(a, b)).toBe(false)
  })
})
