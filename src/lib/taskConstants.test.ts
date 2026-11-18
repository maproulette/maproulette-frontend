import { describe, expect, it } from 'vitest'
import { testT } from '@/test/translate'
import {
  getStatusLabel,
  STATUS_BAR_COLORS,
  STATUS_COLOR,
  STATUS_KEY_TO_ID,
  STATUS_MESSAGES,
  STATUS_PILL_COLORS,
  STATUS_TINT_COLORS,
  tabTriggerClass,
} from './taskConstants.ts'

const t = testT

describe('STATUS_MESSAGES', () => {
  it('has a message for every canonical status id', () => {
    expect(STATUS_MESSAGES[0].defaultMessage).toBe('Created')
    expect(STATUS_MESSAGES[9].defaultMessage).toBe('Disabled')
    expect(Object.keys(STATUS_MESSAGES)).toHaveLength(10)
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

describe('color record completeness', () => {
  const ids = Object.keys(STATUS_MESSAGES).map(Number)

  it.each([
    ['STATUS_COLOR', STATUS_COLOR],
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
