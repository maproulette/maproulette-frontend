import { describe, expect, it } from 'vitest'
import {
  isTaskPriority,
  PRIORITY_COLOR,
  PRIORITY_MESSAGES,
  PRIORITY_TIERS,
  TaskPriority,
} from './Priority.ts'

describe('PRIORITY_MESSAGES', () => {
  it('labels every priority value', () => {
    expect(PRIORITY_MESSAGES[TaskPriority.HIGH].defaultMessage).toBe('High')
    expect(PRIORITY_MESSAGES[TaskPriority.MEDIUM].defaultMessage).toBe('Medium')
    expect(PRIORITY_MESSAGES[TaskPriority.LOW].defaultMessage).toBe('Low')
  })
})

describe('PRIORITY_COLOR', () => {
  it('provides light, dark, hex, and bg classes for every priority value', () => {
    for (const value of Object.values(TaskPriority)) {
      const color = PRIORITY_COLOR[value]
      expect(color.light).toMatch(/^bg-/)
      expect(color.dark).toMatch(/^dark:bg-/)
      expect(color.hex).toMatch(/^#[0-9a-f]{6}$/)
      expect(color.bg).toContain(color.light)
      expect(color.bg).toContain(color.dark)
    }
  })
})

describe('PRIORITY_TIERS', () => {
  it('orders tiers from high to low priority', () => {
    expect(PRIORITY_TIERS).toEqual([TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW])
  })
})

describe('isTaskPriority', () => {
  it('accepts only the three priority tiers', () => {
    expect([0, 1, 2].every(isTaskPriority)).toBe(true)
    expect(isTaskPriority(3)).toBe(false)
    expect(isTaskPriority(-1)).toBe(false)
  })
})
