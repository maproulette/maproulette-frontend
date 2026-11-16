import { describe, expect, it } from 'vitest'
import { cn, initials } from './utils.ts'

describe('cn', () => {
  it('joins simple class name strings', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, '', 'b')).toBe('a b')
  })

  it('merges conflicting tailwind classes, keeping the last one', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('supports conditional object syntax', () => {
    expect(cn({ a: true, b: false, c: true })).toBe('a c')
  })

  it('supports arrays of class values', () => {
    expect(cn(['a', 'b'], 'c')).toBe('a b c')
  })
})

describe('initials', () => {
  it('returns initials for a full name', () => {
    expect(initials('John Doe')).toBe('JD')
  })

  it('handles a single name', () => {
    expect(initials('Madonna')).toBe('M')
  })

  it('handles more than two words', () => {
    expect(initials('John Jacob Jingleheimer Schmidt')).toBe('JJJS')
  })

  it('trims leading and trailing whitespace', () => {
    expect(initials('  John Doe  ')).toBe('JD')
  })

  it('collapses repeated internal whitespace', () => {
    expect(initials('John    Doe')).toBe('JD')
  })

  it('uppercases lowercase initials', () => {
    expect(initials('john doe')).toBe('JD')
  })

  it('returns an empty string for an empty name', () => {
    expect(initials('')).toBe('')
  })

  it('returns an empty string for a name that is only whitespace', () => {
    expect(initials('   ')).toBe('')
  })
})
