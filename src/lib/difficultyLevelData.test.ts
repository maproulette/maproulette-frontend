import { describe, expect, it } from 'vitest'
import { getDifficultyColor, getDifficultyLabel } from './difficultyLevelData.ts'

const t = (_id: string, _values: unknown, defaultMessage?: string) => defaultMessage ?? _id

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
    [1, 'text-green-600'],
    [2, 'text-yellow-600'],
    [3, 'text-red-600'],
    [0, 'text-yellow-600'],
    [99, 'text-yellow-600'],
  ] as const)('difficulty %s returns %s', (difficulty, expected) => {
    expect(getDifficultyColor(difficulty)).toBe(expected)
  })
})
