import { describe, expect, it } from 'vitest'
import { testT } from '@/test/translate'
import {
  getDifficultyBadgeColor,
  getDifficultyColor,
  getDifficultyLabel,
} from './difficultyLevelData.ts'

const t = testT

describe('getDifficultyLabel', () => {
  it.each([
    [1, 'Easy'],
    [2, 'Normal'],
    [3, 'Expert'],
    [0, 'Normal'],
    [99, 'Normal'],
  ] as const)('difficulty %s returns %s', (difficulty, expected) => {
    expect(getDifficultyLabel(t, difficulty)).toBe(expected)
  })
})

describe('getDifficultyColor', () => {
  it.each([
    [1, 'text-success'],
    [2, 'text-warning'],
    [3, 'text-danger'],
  ] as const)('difficulty %s uses %s', (difficulty, expected) => {
    expect(getDifficultyColor(difficulty)).toBe(expected)
  })

  it('treats an unknown difficulty as normal', () => {
    expect(getDifficultyColor(99)).toBe(getDifficultyColor(2))
  })
})

describe('getDifficultyBadgeColor', () => {
  it.each([
    [1, 'mint'],
    [2, 'mango'],
    [3, 'coral'],
  ] as const)('difficulty %s uses %s', (difficulty, hue) => {
    expect(getDifficultyBadgeColor(difficulty)).toContain(`bg-${hue}-`)
  })

  it('treats an unknown difficulty as normal', () => {
    expect(getDifficultyBadgeColor(99)).toBe(getDifficultyBadgeColor(2))
  })
})
