import { describe, expect, it } from 'vitest'
import { maskKey } from './FieldApiKey'

describe('maskKey', () => {
  it('returns an empty string for an empty key', () => {
    expect(maskKey('')).toBe('')
  })

  it('masks a key of 8 characters or fewer entirely as 8 bullets', () => {
    expect(maskKey('abc')).toBe('••••••••')
    expect(maskKey('abcdefgh')).toBe('••••••••')
  })

  it('keeps the first and last 4 characters visible for a normal-length key', () => {
    // length 16: 16 - 8 = 8 middle characters masked
    expect(maskKey('abcdefghijklmnop')).toBe(`abcd${'•'.repeat(8)}mnop`)
  })

  it('masks at least 4 characters in the middle even when length - 8 is smaller', () => {
    // length 9: length - 8 = 1, but Math.max(4, 1) keeps the minimum masked run at 4
    expect(maskKey('abcdefghi')).toBe(`abcd${'•'.repeat(4)}fghi`)
  })
})
