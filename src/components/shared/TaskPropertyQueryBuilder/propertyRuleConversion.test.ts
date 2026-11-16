import { describe, expect, it } from 'vitest'
import {
  binaryToFlat,
  createEmptyLeaf,
  describeRule,
  flatToBinary,
  validatePropertyRules,
} from './propertyRuleConversion'
import type { BinaryGroup, BinaryLeaf, PropertyRule, PropertyRuleGroup } from './propertyRuleTypes'

const leaf = (overrides: Partial<BinaryLeaf> = {}): BinaryLeaf => ({
  key: 'surface',
  value: 'paved',
  operator: 'equals',
  ...overrides,
})

const flatLeaf = (overrides: Partial<BinaryLeaf> = {}): PropertyRule => ({
  type: 'leaf',
  ...leaf(overrides),
})

const binaryGroup = (
  left: BinaryLeaf | BinaryGroup,
  right: BinaryLeaf | BinaryGroup,
  condition: 'and' | 'or' = 'and'
): BinaryGroup => ({ valueType: 'compound rule', condition, left, right })

describe('binaryToFlat', () => {
  it('converts a single leaf', () => {
    expect(binaryToFlat(leaf())).toEqual(flatLeaf())
  })

  it('flattens a chain of same-condition groups into a single flat group', () => {
    // ((a AND b) AND c) should flatten to {condition: and, rules: [a, b, c]}
    const tree = binaryGroup(
      binaryGroup(leaf({ key: 'a' }), leaf({ key: 'b' })),
      leaf({ key: 'c' })
    )
    expect(binaryToFlat(tree)).toEqual({
      type: 'group',
      condition: 'and',
      rules: [flatLeaf({ key: 'a' }), flatLeaf({ key: 'b' }), flatLeaf({ key: 'c' })],
    })
  })

  it('keeps a differing nested condition as its own nested group', () => {
    // (a AND b) OR c should NOT flatten the AND into the OR
    const tree = binaryGroup(
      binaryGroup(leaf({ key: 'a' }), leaf({ key: 'b' })),
      leaf({ key: 'c' }),
      'or'
    )
    expect(binaryToFlat(tree)).toEqual({
      type: 'group',
      condition: 'or',
      rules: [
        {
          type: 'group',
          condition: 'and',
          rules: [flatLeaf({ key: 'a' }), flatLeaf({ key: 'b' })],
        },
        flatLeaf({ key: 'c' }),
      ],
    })
  })
})

describe('flatToBinary', () => {
  it('converts a single flat leaf', () => {
    expect(flatToBinary(flatLeaf())).toEqual(leaf())
  })

  it('collapses a single-child group to just that child', () => {
    const rule: PropertyRuleGroup = { type: 'group', condition: 'and', rules: [flatLeaf()] }
    expect(flatToBinary(rule)).toEqual(leaf())
  })

  it('throws on an empty rule group', () => {
    const rule: PropertyRuleGroup = { type: 'group', condition: 'and', rules: [] }
    expect(() => flatToBinary(rule)).toThrow('Empty rule group')
  })

  it('builds a left-associated binary tree for a 3+ element flat group', () => {
    const rule: PropertyRuleGroup = {
      type: 'group',
      condition: 'and',
      rules: [flatLeaf({ key: 'a' }), flatLeaf({ key: 'b' }), flatLeaf({ key: 'c' })],
    }
    expect(flatToBinary(rule)).toEqual(
      binaryGroup(binaryGroup(leaf({ key: 'a' }), leaf({ key: 'b' })), leaf({ key: 'c' }))
    )
  })
})

describe('round-trip: binaryToFlat -> flatToBinary', () => {
  it('round-trips a single leaf', () => {
    const original = leaf()
    expect(flatToBinary(binaryToFlat(original))).toEqual(original)
  })

  it('round-trips a flat multi-child AND group (re-flattened, same shape since already left-associated)', () => {
    const original = binaryGroup(
      binaryGroup(leaf({ key: 'a' }), leaf({ key: 'b' })),
      leaf({ key: 'c' })
    )
    expect(flatToBinary(binaryToFlat(original))).toEqual(original)
  })

  it('round-trips a mixed AND/OR tree', () => {
    const original = binaryGroup(
      binaryGroup(leaf({ key: 'a' }), leaf({ key: 'b' })),
      leaf({ key: 'c' }),
      'or'
    )
    expect(flatToBinary(binaryToFlat(original))).toEqual(original)
  })
})

describe('round-trip: flatToBinary -> binaryToFlat', () => {
  it('round-trips a flat group of 3+ leaves back to the same flat shape', () => {
    const original: PropertyRuleGroup = {
      type: 'group',
      condition: 'and',
      rules: [flatLeaf({ key: 'a' }), flatLeaf({ key: 'b' }), flatLeaf({ key: 'c' })],
    }
    expect(binaryToFlat(flatToBinary(original))).toEqual(original)
  })
})

describe('validatePropertyRules', () => {
  it('flags a leaf with no key', () => {
    expect(validatePropertyRules(flatLeaf({ key: '' }))).toContain(
      'Every rule needs a property key'
    )
  })

  it('flags a leaf missing a value when the operator needs one', () => {
    expect(validatePropertyRules(flatLeaf({ value: '' }))).toContain('Value required')
  })

  it('does not require a value for exists/missing operators', () => {
    expect(validatePropertyRules(flatLeaf({ value: '', operator: 'exists' }))).toEqual([])
    expect(validatePropertyRules(flatLeaf({ value: '', operator: 'missing' }))).toEqual([])
  })

  it('flags an empty group', () => {
    const rule: PropertyRuleGroup = { type: 'group', condition: 'and', rules: [] }
    expect(validatePropertyRules(rule)).toContain('Group cannot be empty')
  })

  it('recurses into nested groups', () => {
    const rule: PropertyRuleGroup = {
      type: 'group',
      condition: 'and',
      rules: [flatLeaf({ key: '' })],
    }
    expect(validatePropertyRules(rule)).toContain('Every rule needs a property key')
  })
})

describe('describeRule', () => {
  it('describes exists/missing without a value', () => {
    expect(describeRule(flatLeaf({ operator: 'exists' }))).toBe('surface exists')
    expect(describeRule(flatLeaf({ operator: 'missing' }))).toBe('surface missing')
  })

  it('describes a leaf with its value', () => {
    expect(describeRule(flatLeaf())).toBe('surface equals paved')
  })

  it('joins group children with AND/OR and wraps in parens', () => {
    const orRule: PropertyRuleGroup = {
      type: 'group',
      condition: 'or',
      rules: [flatLeaf({ key: 'a' }), flatLeaf({ key: 'b' })],
    }
    expect(describeRule(orRule)).toBe('(a equals paved OR b equals paved)')

    const andRule: PropertyRuleGroup = {
      type: 'group',
      condition: 'and',
      rules: [flatLeaf({ key: 'a' }), flatLeaf({ key: 'b' })],
    }
    expect(describeRule(andRule)).toBe('(a equals paved AND b equals paved)')
  })
})

describe('createEmptyLeaf', () => {
  it('produces a blank leaf defaulting to equals', () => {
    expect(createEmptyLeaf()).toEqual({ type: 'leaf', key: '', value: '', operator: 'equals' })
  })
})
