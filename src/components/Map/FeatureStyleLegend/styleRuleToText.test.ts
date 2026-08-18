import { describe, expect, it } from 'vitest'
import { styleRuleToText, type TaskPropertySearch } from './styleRuleToText.ts'

describe('styleRuleToText', () => {
  it('returns an empty string for an undefined node', () => {
    expect(styleRuleToText(undefined)).toBe('')
  })

  it('renders a single leaf comparison', () => {
    const node: TaskPropertySearch = { key: 'highway', operationType: 'equals', value: 'primary' }
    expect(styleRuleToText(node)).toBe('highway = primary')
  })

  it('defaults to "=" for a leaf with no operationType', () => {
    const node: TaskPropertySearch = { key: 'highway', value: 'primary' }
    expect(styleRuleToText(node)).toBe('highway = primary')
  })

  it('renders each known comparison operator symbol', () => {
    expect(styleRuleToText({ key: 'lanes', operationType: 'notEqual', value: 2 })).toBe(
      'lanes != 2'
    )
    expect(styleRuleToText({ key: 'name', operationType: 'contains', value: 'Main' })).toBe(
      'name contains Main'
    )
    expect(styleRuleToText({ key: 'lanes', operationType: 'greaterThan', value: 1 })).toBe(
      'lanes > 1'
    )
    expect(styleRuleToText({ key: 'lanes', operationType: 'lessThan', value: 4 })).toBe('lanes < 4')
    expect(styleRuleToText({ key: 'lanes', operationType: 'greaterThanOrEqual', value: 1 })).toBe(
      'lanes >= 1'
    )
    expect(styleRuleToText({ key: 'lanes', operationType: 'lessThanOrEqual', value: 4 })).toBe(
      'lanes <= 4'
    )
  })

  it('renders an AND composite of two rules', () => {
    const node: TaskPropertySearch = {
      condition: 'and',
      left: { key: 'highway', operationType: 'equals', value: 'primary' },
      right: { key: 'lanes', operationType: 'greaterThan', value: 1 },
    }
    expect(styleRuleToText(node)).toBe('(highway = primary AND lanes > 1)')
  })

  it('renders an AND composite of three rules via nesting', () => {
    const node: TaskPropertySearch = {
      condition: 'and',
      left: {
        condition: 'and',
        left: { key: 'highway', operationType: 'equals', value: 'primary' },
        right: { key: 'lanes', operationType: 'greaterThan', value: 1 },
      },
      right: { key: 'name', operationType: 'exists' },
    }
    expect(styleRuleToText(node)).toBe('((highway = primary AND lanes > 1) AND name exists)')
  })

  it('renders an OR composite of two rules', () => {
    const node: TaskPropertySearch = {
      condition: 'or',
      left: { key: 'highway', operationType: 'equals', value: 'primary' },
      right: { key: 'highway', operationType: 'equals', value: 'secondary' },
    }
    expect(styleRuleToText(node)).toBe('(highway = primary OR highway = secondary)')
  })

  it('treats a composite with a missing condition as AND', () => {
    const node: TaskPropertySearch = {
      left: { key: 'a', operationType: 'equals', value: 1 },
      right: { key: 'b', operationType: 'equals', value: 2 },
    }
    expect(styleRuleToText(node)).toBe('(a = 1 AND b = 2)')
  })

  it('special-cases the exists operator without a value', () => {
    expect(styleRuleToText({ key: 'name', operationType: 'exists', value: 'ignored' })).toBe(
      'name exists'
    )
  })

  it('special-cases the missing operator without a value', () => {
    expect(styleRuleToText({ key: 'name', operationType: 'missing' })).toBe('name missing')
  })

  it('falls back to the raw operationType for an unknown operator', () => {
    expect(styleRuleToText({ key: 'name', operationType: 'startsWith', value: 'Main' })).toBe(
      'name startsWith Main'
    )
  })

  it('falls back to "?" for a leaf missing a key', () => {
    expect(styleRuleToText({ operationType: 'equals', value: 'primary' })).toBe('? = primary')
  })

  it('falls back to an empty value for a non-exists/missing leaf with no value', () => {
    expect(styleRuleToText({ key: 'name', operationType: 'equals' })).toBe('name = ')
  })
})
