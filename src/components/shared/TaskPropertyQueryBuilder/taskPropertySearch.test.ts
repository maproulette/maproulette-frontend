import { describe, expect, it } from 'vitest'
import type { BinaryNode } from './propertyRuleTypes.ts'
import { binaryToTaskPropertySearch, searchableOperators } from './taskPropertySearch.ts'

const leaf = (props: Partial<Extract<BinaryNode, { key: string }>> = {}): BinaryNode => ({
  key: 'highway',
  value: 'motorway',
  operator: 'equals',
  valueType: 'string',
  ...props,
})

describe('binaryToTaskPropertySearch', () => {
  it('is null for no rule', () => {
    expect(binaryToTaskPropertySearch(null)).toBeNull()
    expect(binaryToTaskPropertySearch(undefined)).toBeNull()
  })

  it('converts a text leaf', () => {
    expect(binaryToTaskPropertySearch(leaf())).toEqual({
      key: 'highway',
      value: 'motorway',
      valueType: 'string',
      searchType: 'equals',
    })
  })

  it('uses the numeric vocabulary for number leaves', () => {
    const node = leaf({ key: 'lanes', value: '5', operator: 'greaterThan', valueType: 'number' })
    expect(binaryToTaskPropertySearch(node)).toEqual({
      key: 'lanes',
      value: '5',
      valueType: 'number',
      searchType: 'greater_than',
    })
  })

  it('maps the string-only operators', () => {
    for (const [operator, searchType] of [
      ['notEqual', 'not_equal'],
      ['contains', 'contains'],
      ['exists', 'exists'],
      ['missing', 'missing'],
    ] as const) {
      expect(binaryToTaskPropertySearch(leaf({ operator }))?.searchType).toBe(searchType)
    }
  })

  it('nests compound rules with their operation type', () => {
    const node: BinaryNode = {
      valueType: 'compound rule',
      condition: 'or',
      left: leaf(),
      right: leaf({ key: 'lanes', value: '5', operator: 'lessThan', valueType: 'number' }),
    }
    expect(binaryToTaskPropertySearch(node)).toEqual({
      operationType: 'or',
      left: { key: 'highway', value: 'motorway', valueType: 'string', searchType: 'equals' },
      right: { key: 'lanes', value: '5', valueType: 'number', searchType: 'less_than' },
    })
  })

  it('is null for a leaf with no property name', () => {
    expect(binaryToTaskPropertySearch(leaf({ key: '   ' }))).toBeNull()
  })

  it('is null for an operator the backend cannot search on', () => {
    const node = leaf({ key: 'lanes', operator: 'greaterThanOrEqual', valueType: 'number' })
    expect(binaryToTaskPropertySearch(node)).toBeNull()
  })

  it('degrades a compound rule to whichever side is usable', () => {
    const node: BinaryNode = {
      valueType: 'compound rule',
      condition: 'and',
      left: leaf(),
      right: leaf({ key: '' }),
    }
    expect(binaryToTaskPropertySearch(node)).toEqual({
      key: 'highway',
      value: 'motorway',
      valueType: 'string',
      searchType: 'equals',
    })
  })

  it('is null when neither side of a compound rule is usable', () => {
    const node: BinaryNode = {
      valueType: 'compound rule',
      condition: 'and',
      left: leaf({ key: '' }),
      right: leaf({ key: '' }),
    }
    expect(binaryToTaskPropertySearch(node)).toBeNull()
  })
})

describe('searchableOperators', () => {
  it('offers only operators the backend understands', () => {
    expect(searchableOperators('string')).toEqual([
      'equals',
      'notEqual',
      'contains',
      'exists',
      'missing',
    ])
    expect(searchableOperators('number')).toEqual(['equals', 'notEqual', 'greaterThan', 'lessThan'])
  })
})
