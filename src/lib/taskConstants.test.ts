import { describe, expect, it } from 'vitest'
import {
  getStatusLabel,
  resolveHex,
  STATUS_BAR_COLORS,
  STATUS_COLORS,
  STATUS_HEX,
  STATUS_HEX_COLORS,
  STATUS_KEY_TO_ID,
  STATUS_LABELS,
  STATUS_PILL_COLORS,
  STATUS_TEXT_COLORS,
  STATUS_TINT_COLORS,
  TAILWIND_HEX,
  tabTriggerClass,
} from './taskConstants.ts'

const t = (_id: string, _values: unknown, defaultMessage?: string) => defaultMessage ?? _id

describe('STATUS_LABELS', () => {
  it('has a label for every canonical status id', () => {
    expect(STATUS_LABELS[0]).toBe('Created')
    expect(STATUS_LABELS[9]).toBe('Disabled')
    expect(Object.keys(STATUS_LABELS)).toHaveLength(10)
  })
})

describe('getStatusLabel', () => {
  it('returns the translated label for a recognized status', () => {
    expect(getStatusLabel(t, 0)).toBe('Created')
    expect(getStatusLabel(t, 8)).toBe('Validated')
  })

  it('returns undefined for an unrecognized status', () => {
    expect(getStatusLabel(t, 99)).toBeUndefined()
  })
})

describe('STATUS_KEY_TO_ID', () => {
  it('maps MR3 string keys to canonical numeric ids', () => {
    expect(STATUS_KEY_TO_ID.available).toBe(0)
    expect(STATUS_KEY_TO_ID.created).toBe(0)
    expect(STATUS_KEY_TO_ID.fixed).toBe(1)
    expect(STATUS_KEY_TO_ID.falsePositive).toBe(2)
    expect(STATUS_KEY_TO_ID.skipped).toBe(3)
    expect(STATUS_KEY_TO_ID.deleted).toBe(4)
    expect(STATUS_KEY_TO_ID.alreadyFixed).toBe(5)
    expect(STATUS_KEY_TO_ID.tooHard).toBe(6)
    expect(STATUS_KEY_TO_ID.answered).toBe(7)
    expect(STATUS_KEY_TO_ID.validated).toBe(8)
    expect(STATUS_KEY_TO_ID.disabled).toBe(9)
  })
})

describe('resolveHex', () => {
  it('resolves a known tailwind token to its hex value', () => {
    expect(resolveHex('cyan-400')).toBe('#22d3ee')
  })

  it('returns the input unchanged for an unknown token', () => {
    expect(resolveHex('not-a-real-token')).toBe('not-a-real-token')
  })
})

describe('STATUS_HEX', () => {
  it('derives a hex value for every status from STATUS_HEX_COLORS', () => {
    for (const [id, token] of Object.entries(STATUS_HEX_COLORS)) {
      expect(STATUS_HEX[Number(id)]).toBe(TAILWIND_HEX[token])
    }
  })
})

describe('color record completeness', () => {
  const ids = Object.keys(STATUS_LABELS).map(Number)

  it.each([
    ['STATUS_COLORS', STATUS_COLORS],
    ['STATUS_TEXT_COLORS', STATUS_TEXT_COLORS],
    ['STATUS_PILL_COLORS', STATUS_PILL_COLORS],
    ['STATUS_BAR_COLORS', STATUS_BAR_COLORS],
    ['STATUS_TINT_COLORS', STATUS_TINT_COLORS],
  ])('%s covers every status id', (_name, record: Record<number, string>) => {
    for (const id of ids) expect(record[id]).toBeDefined()
  })
})

describe('tabTriggerClass', () => {
  it('is a non-empty class string', () => {
    expect(typeof tabTriggerClass).toBe('string')
    expect(tabTriggerClass.length).toBeGreaterThan(0)
  })
})
