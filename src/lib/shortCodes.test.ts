import { describe, expect, it } from 'vitest'
import { hasShortCodes, responseFieldNames, tokenizeInstructions } from './shortCodes.ts'

describe('tokenizeInstructions', () => {
  it('is empty for no instructions', () => {
    expect(tokenizeInstructions('')).toEqual([])
    expect(tokenizeInstructions(null)).toEqual([])
    expect(tokenizeInstructions(undefined)).toEqual([])
  })

  it('leaves plain instructions as a single text token', () => {
    expect(tokenizeInstructions('Check the gate is mapped.')).toEqual([
      { kind: 'text', text: 'Check the gate is mapped.' },
    ])
  })

  it('parses a checkbox short code', () => {
    const tokens = tokenizeInstructions('[checkbox "Is it locked?" name="locked"]')
    expect(tokens).toEqual([{ kind: 'checkbox', label: 'Is it locked?', name: 'locked' }])
  })

  it('parses a select short code and splits its values', () => {
    const tokens = tokenizeInstructions('[select "Surface" name="surface" values="paved, gravel"]')
    expect(tokens).toEqual([
      { kind: 'select', label: 'Surface', name: 'surface', values: ['paved', 'gravel'] },
    ])
  })

  it('parses a copyable short code', () => {
    expect(tokenizeInstructions('[copyable "note=fixme"]')).toEqual([
      { kind: 'copyable', text: 'note=fixme' },
    ])
  })

  it('keeps surrounding prose alongside a short code', () => {
    const tokens = tokenizeInstructions('Before you start: [copyable "abc"] then continue.')
    expect(tokens).toEqual([
      { kind: 'text', text: 'Before you start: ' },
      { kind: 'copyable', text: 'abc' },
      { kind: 'text', text: ' then continue.' },
    ])
  })

  it('accepts the legacy triple-brace form', () => {
    const tokens = tokenizeInstructions('{{{checkbox "Locked?" name="locked"}}}')
    expect(tokens).toEqual([{ kind: 'checkbox', label: 'Locked?', name: 'locked' }])
  })

  it('leaves markdown links alone', () => {
    const text = 'See [the wiki](https://wiki.osm.org) for details.'
    expect(tokenizeInstructions(text)).toEqual([{ kind: 'text', text }])
  })

  it('leaves mustache tags alone', () => {
    const text = 'Survey {{name}} on {{highway}}.'
    expect(tokenizeInstructions(text)).toEqual([{ kind: 'text', text }])
  })

  it('leaves an unrecognised bracketed run as literal text', () => {
    const text = 'Look for [a bracketed aside] here.'
    expect(tokenizeInstructions(text)).toEqual([{ kind: 'text', text }])
  })

  it('merges text either side of an unrecognised short code', () => {
    const tokens = tokenizeInstructions('a [unknown thing] b')
    expect(tokens).toEqual([{ kind: 'text', text: 'a [unknown thing] b' }])
  })

  it('handles several fields in one set of instructions', () => {
    const tokens = tokenizeInstructions(
      'Q1 [checkbox "One" name="one"] Q2 [select "Two" name="two" values="a,b"]'
    )
    expect(tokens.map((token) => token.kind)).toEqual(['text', 'checkbox', 'text', 'select'])
  })
})

describe('responseFieldNames', () => {
  it('lists the fields a mapper is asked to fill in', () => {
    const tokens = tokenizeInstructions(
      '[checkbox "One" name="one"][copyable "x"][select "Two" name="two" values="a"]'
    )
    expect(responseFieldNames(tokens)).toEqual(['one', 'two'])
  })

  it('is empty when the instructions only copy text', () => {
    expect(responseFieldNames(tokenizeInstructions('[copyable "x"]'))).toEqual([])
  })
})

describe('hasShortCodes', () => {
  it('is true only when a recognised short code is present', () => {
    expect(hasShortCodes('[copyable "x"]')).toBe(true)
    expect(hasShortCodes('plain text')).toBe(false)
    expect(hasShortCodes('[not a code]')).toBe(false)
    expect(hasShortCodes('[link](https://example.org)')).toBe(false)
  })
})
