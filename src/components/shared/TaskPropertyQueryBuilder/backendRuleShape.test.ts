import { describe, expect, it } from 'vitest'
import { backendJsonToBinary, binaryToBackendJson } from './backendRuleShape'
import type { BinaryGroup, BinaryLeaf, BinaryNode, PropertyOperator } from './propertyRuleTypes'

const stringLeaf = (overrides: Partial<BinaryLeaf> = {}): BinaryLeaf => ({
  key: 'surface',
  value: 'paved',
  operator: 'equals',
  ...overrides,
})

const numberLeaf = (overrides: Partial<BinaryLeaf> = {}): BinaryLeaf => ({
  key: 'lanes',
  value: '2',
  operator: 'equals',
  valueType: 'number',
  ...overrides,
})

const group = (
  left: BinaryNode,
  right: BinaryNode,
  condition: 'and' | 'or' = 'and'
): BinaryGroup => ({
  valueType: 'compound rule',
  condition,
  left,
  right,
})

describe('binaryToBackendJson', () => {
  it('returns empty string for a null tree', () => {
    expect(binaryToBackendJson(null)).toBe('')
  })

  it('wraps a single leaf in a 1-element AND group', () => {
    const json = binaryToBackendJson(stringLeaf())
    expect(JSON.parse(json)).toEqual({
      condition: 'AND',
      rules: [{ value: 'surface.paved', type: 'string', operator: 'equal' }],
    })
  })

  it('maps string operators to the backend vocabulary', () => {
    const cases: Array<[BinaryLeaf['operator'], string]> = [
      ['equals', 'equal'],
      ['notEqual', 'not_equal'],
      ['contains', 'contains'],
      ['exists', 'is_not_empty'],
      ['missing', 'is_empty'],
    ]
    for (const [operator, backendOperator] of cases) {
      const json = binaryToBackendJson(stringLeaf({ operator }))
      const parsed = JSON.parse(json)
      expect(parsed.rules[0].operator).toBe(backendOperator)
    }
  })

  it('maps number operators to the backend vocabulary and uses double type', () => {
    const cases: Array<[BinaryLeaf['operator'], string]> = [
      ['equals', '=='],
      ['notEqual', '!='],
      ['greaterThan', '>'],
      ['lessThan', '<'],
      ['greaterThanOrEqual', '>='],
      ['lessThanOrEqual', '<='],
    ]
    for (const [operator, backendOperator] of cases) {
      const json = binaryToBackendJson(numberLeaf({ operator }))
      const parsed = JSON.parse(json)
      expect(parsed.rules[0].type).toBe('double')
      expect(parsed.rules[0].operator).toBe(backendOperator)
    }
  })

  it('space-pads an empty value so the backend split still yields two parts', () => {
    const json = binaryToBackendJson(stringLeaf({ value: '' }))
    const parsed = JSON.parse(json)
    expect(parsed.rules[0].value).toBe('surface. ')
  })

  it('drops leaves with an empty/whitespace key', () => {
    expect(binaryToBackendJson(stringLeaf({ key: '  ' }))).toBe('')
  })

  it('collapses a group with only one surviving child instead of nesting it', () => {
    const tree = group(stringLeaf(), stringLeaf({ key: '  ' }))
    const json = binaryToBackendJson(tree)
    const parsed = JSON.parse(json)
    // the surviving leaf becomes the sole rule of the top-level AND wrapper,
    // not a nested single-child group
    expect(parsed).toEqual({
      condition: 'AND',
      rules: [{ value: 'surface.paved', type: 'string', operator: 'equal' }],
    })
  })

  it('preserves AND/OR condition and nesting for a multi-child group', () => {
    const tree = group(stringLeaf(), numberLeaf(), 'or')
    const json = binaryToBackendJson(tree)
    expect(JSON.parse(json)).toEqual({
      condition: 'OR',
      rules: [
        { value: 'surface.paved', type: 'string', operator: 'equal' },
        { value: 'lanes.2', type: 'double', operator: '==' },
      ],
    })
  })

  it('preserves a multi-child AND group instead of defaulting to OR', () => {
    const tree = group(stringLeaf(), numberLeaf(), 'and')
    const json = binaryToBackendJson(tree)
    expect(JSON.parse(json)).toEqual({
      condition: 'AND',
      rules: [
        { value: 'surface.paved', type: 'string', operator: 'equal' },
        { value: 'lanes.2', type: 'double', operator: '==' },
      ],
    })
  })

  it('falls back to "==" for a number operator with no backend mapping', () => {
    const cases: Array<BinaryLeaf['operator']> = ['contains', 'exists', 'missing']
    for (const operator of cases) {
      const json = binaryToBackendJson(numberLeaf({ operator }))
      expect(JSON.parse(json).rules[0].operator).toBe('==')
    }
  })

  it('falls back to "equal" for a string operator with no backend mapping', () => {
    const bogusOperator = 'bogus' as unknown as PropertyOperator
    const json = binaryToBackendJson(stringLeaf({ operator: bogusOperator }))
    expect(JSON.parse(json).rules[0].operator).toBe('equal')
  })

  it('returns empty string when every leaf in a group is invalid', () => {
    const tree = group(stringLeaf({ key: '' }), stringLeaf({ key: '  ' }))
    expect(binaryToBackendJson(tree)).toBe('')
  })
})

describe('backendJsonToBinary', () => {
  it('returns null for null/undefined/empty/"{}"" input', () => {
    expect(backendJsonToBinary(null)).toBeNull()
    expect(backendJsonToBinary(undefined)).toBeNull()
    expect(backendJsonToBinary('')).toBeNull()
    expect(backendJsonToBinary('   ')).toBeNull()
    expect(backendJsonToBinary('{}')).toBeNull()
  })

  it('returns null for unparsable JSON', () => {
    expect(backendJsonToBinary('not json')).toBeNull()
  })

  it('parses a single backend leaf back into a BinaryLeaf', () => {
    const raw = {
      condition: 'AND',
      rules: [{ value: 'surface.paved', type: 'string', operator: 'equal' }],
    }
    expect(backendJsonToBinary(JSON.stringify(raw))).toEqual(stringLeaf())
  })

  it('restores an empty value from the space-padding workaround', () => {
    const raw = {
      condition: 'AND',
      rules: [{ value: 'surface. ', type: 'string', operator: 'equal' }],
    }
    expect(backendJsonToBinary(raw)).toEqual(stringLeaf({ value: '' }))
  })

  it('parses numeric types and sets valueType: number', () => {
    const raw = { condition: 'AND', rules: [{ value: 'lanes.2', type: 'double', operator: '==' }] }
    expect(backendJsonToBinary(raw)).toEqual(numberLeaf())
  })

  it('maps >= and <= to greaterThanOrEqual/lessThanOrEqual operators', () => {
    const gte = { condition: 'AND', rules: [{ value: 'lanes.2', type: 'double', operator: '>=' }] }
    expect(backendJsonToBinary(gte)).toEqual(numberLeaf({ operator: 'greaterThanOrEqual' }))
    const lte = { condition: 'AND', rules: [{ value: 'lanes.2', type: 'double', operator: '<=' }] }
    expect(backendJsonToBinary(lte)).toEqual(numberLeaf({ operator: 'lessThanOrEqual' }))
  })

  it('rebuilds a multi-child group with condition and nesting', () => {
    const raw = {
      condition: 'OR',
      rules: [
        { value: 'surface.paved', type: 'string', operator: 'equal' },
        { value: 'lanes.2', type: 'double', operator: '==' },
      ],
    }
    expect(backendJsonToBinary(raw)).toEqual(group(stringLeaf(), numberLeaf(), 'or'))
  })

  it('passes through a legacy BinaryNode shape untouched', () => {
    const legacyLeaf: BinaryLeaf = { key: 'surface', value: 'paved', operator: 'equals' }
    expect(backendJsonToBinary(legacyLeaf)).toEqual(legacyLeaf)

    const legacyGroup: BinaryGroup = group(stringLeaf(), numberLeaf())
    expect(backendJsonToBinary(legacyGroup)).toEqual(legacyGroup)
  })

  it('returns null when a leaf has an unrecognized operator', () => {
    const raw = {
      condition: 'AND',
      rules: [{ value: 'surface.paved', type: 'string', operator: 'bogus' }],
    }
    expect(backendJsonToBinary(raw)).toBeNull()
  })

  it('returns null for a top-level value that is not an object (e.g. a bare number)', () => {
    expect(backendJsonToBinary(5)).toBeNull()
    expect(backendJsonToBinary('5')).toBeNull()
  })

  it('defaults to "and" when a group is missing its condition field', () => {
    const raw = {
      rules: [
        { value: 'surface.paved', type: 'string', operator: 'equal' },
        { value: 'lanes.2', type: 'double', operator: '==' },
      ],
    }
    expect(backendJsonToBinary(raw)).toEqual(group(stringLeaf(), numberLeaf(), 'and'))
  })

  it('skips non-object entries in a rules array instead of throwing', () => {
    const raw = {
      condition: 'AND',
      rules: [null, { value: 'surface.paved', type: 'string', operator: 'equal' }],
    }
    expect(backendJsonToBinary(raw)).toEqual(stringLeaf())
  })

  it('rejects a leaf whose value is not a string', () => {
    const raw = { condition: 'AND', rules: [{ value: 5, type: 'string', operator: 'equal' }] }
    expect(backendJsonToBinary(raw)).toBeNull()
  })

  it('rejects a leaf value with no "." separator', () => {
    const raw = {
      condition: 'AND',
      rules: [{ value: 'novalue', type: 'string', operator: 'equal' }],
    }
    expect(backendJsonToBinary(raw)).toBeNull()
  })

  it('defaults to string type and empty operator when a leaf omits type/operator', () => {
    const raw = { condition: 'AND', rules: [{ value: 'surface.paved' }] }
    // no `type` -> defaults to 'string'; no `operator` -> defaults to '' -> unrecognized -> null
    expect(backendJsonToBinary(raw)).toBeNull()
  })
})

describe('round-trip: binaryToBackendJson -> backendJsonToBinary', () => {
  it('round-trips a single string leaf', () => {
    const original = stringLeaf()
    const restored = backendJsonToBinary(binaryToBackendJson(original))
    expect(restored).toEqual(original)
  })

  it('round-trips a single number leaf', () => {
    const original = numberLeaf()
    const restored = backendJsonToBinary(binaryToBackendJson(original))
    expect(restored).toEqual(original)
  })

  it('round-trips an empty-value leaf through the space-padding workaround', () => {
    const original = stringLeaf({ value: '' })
    const restored = backendJsonToBinary(binaryToBackendJson(original))
    expect(restored).toEqual(original)
  })

  it('round-trips a multi-child AND/OR group', () => {
    const original = group(stringLeaf(), numberLeaf(), 'or')
    const restored = backendJsonToBinary(binaryToBackendJson(original))
    expect(restored).toEqual(original)
  })

  it('round-trips a group that collapses to a single surviving leaf', () => {
    const original = group(stringLeaf(), stringLeaf({ key: '' }))
    const restored = backendJsonToBinary(binaryToBackendJson(original))
    expect(restored).toEqual(stringLeaf())
  })
})
