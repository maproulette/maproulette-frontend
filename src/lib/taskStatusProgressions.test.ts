import { describe, expect, it } from 'vitest'
import { allowedStatusProgressions, isFinalStatus, TASK_STATUS } from './taskStatusProgressions.ts'

const sorted = (set: Set<number>) => [...set].sort((a, b) => a - b)

describe('allowedStatusProgressions', () => {
  it('lets a new task go anywhere a mapper might take it', () => {
    expect(sorted(allowedStatusProgressions(TASK_STATUS.created))).toEqual([1, 2, 3, 4, 5, 6, 9])
  })

  it('offers the same set again for a skipped or too-hard task, minus deletion', () => {
    for (const status of [TASK_STATUS.skipped, TASK_STATUS.tooHard]) {
      expect(sorted(allowedStatusProgressions(status))).toEqual([1, 2, 3, 5, 6])
    }
  })

  it('lets a deleted task be restored or disabled', () => {
    expect(sorted(allowedStatusProgressions(TASK_STATUS.deleted))).toEqual(
      sorted(new Set([TASK_STATUS.created, TASK_STATUS.disabled]))
    )
  })

  it('lets a disabled task be restored or deleted', () => {
    expect(sorted(allowedStatusProgressions(TASK_STATUS.disabled))).toEqual(
      sorted(new Set([TASK_STATUS.created, TASK_STATUS.deleted]))
    )
  })

  it('treats completed work as final', () => {
    expect(allowedStatusProgressions(TASK_STATUS.fixed).size).toBe(0)
    expect(allowedStatusProgressions(TASK_STATUS.alreadyFixed).size).toBe(0)
  })

  it('lets a not-an-issue call be corrected to fixed, and nothing else', () => {
    expect(sorted(allowedStatusProgressions(TASK_STATUS.falsePositive))).toEqual([
      TASK_STATUS.fixed,
    ])
  })

  it('includes the current status only when asked', () => {
    expect(allowedStatusProgressions(TASK_STATUS.skipped).has(TASK_STATUS.skipped)).toBe(true)
    expect(allowedStatusProgressions(TASK_STATUS.fixed, true).has(TASK_STATUS.fixed)).toBe(true)
    expect(allowedStatusProgressions(TASK_STATUS.fixed).has(TASK_STATUS.fixed)).toBe(false)
  })

  it('offers nothing for a status it does not recognise, rather than throwing', () => {
    expect(() => allowedStatusProgressions(42)).not.toThrow()
    expect(allowedStatusProgressions(42).size).toBe(0)
  })
})

describe('isFinalStatus', () => {
  it('covers the three statuses that represent a decision made', () => {
    expect(isFinalStatus(TASK_STATUS.fixed)).toBe(true)
    expect(isFinalStatus(TASK_STATUS.alreadyFixed)).toBe(true)
    expect(isFinalStatus(TASK_STATUS.falsePositive)).toBe(true)
    expect(isFinalStatus(TASK_STATUS.created)).toBe(false)
    expect(isFinalStatus(TASK_STATUS.skipped)).toBe(false)
  })
})
