import { describe, expect, it } from 'vitest'
import type { DifficultyLevel, WorkOnCategory } from './filterTypes'
import { difficultyMap, reverseDifficultyMap, workOnCategoryMap } from './filterUtils'

describe('workOnCategoryMap', () => {
  it('maps "Anything" to null (no keyword filtering)', () => {
    expect(workOnCategoryMap.Anything).toBeNull()
  })

  it('maps every non-"Anything" category to a non-empty array of keywords', () => {
    const categories = Object.keys(workOnCategoryMap) as WorkOnCategory[]
    for (const category of categories) {
      if (category === 'Anything') continue
      const keywords = workOnCategoryMap[category]
      expect(Array.isArray(keywords)).toBe(true)
      expect(keywords?.length).toBeGreaterThan(0)
    }
  })

  it('maps specific known categories to their expected keyword sets', () => {
    expect(workOnCategoryMap.Water).toEqual(['water', 'waterway'])
    expect(workOnCategoryMap.Buildings).toEqual(['buildings', 'building'])
    expect(workOnCategoryMap['Roads / Pedestrian / Cycleways']).toEqual([
      'roads',
      'pedestrian',
      'cycleways',
      'highway',
    ])
    expect(workOnCategoryMap['Points / Areas of Interest']).toEqual(['poi', 'amenity', 'leisure'])
    expect(workOnCategoryMap['Land Use / Administrative Boundaries']).toEqual([
      'landuse',
      'boundary',
      'administrative',
    ])
    expect(workOnCategoryMap.Transit).toEqual(['transit', 'public_transport', 'railway'])
  })

  it('has no duplicate keywords within a single category', () => {
    for (const keywords of Object.values(workOnCategoryMap)) {
      if (!keywords) continue
      expect(new Set(keywords).size).toBe(keywords.length)
    }
  })
})

describe('difficultyMap', () => {
  it('maps "Any" to undefined (no difficulty filter applied)', () => {
    expect(difficultyMap.Any).toBeUndefined()
  })

  it('maps Easy/Normal/Expert to their numeric API values', () => {
    expect(difficultyMap.Easy).toBe(1)
    expect(difficultyMap.Normal).toBe(2)
    expect(difficultyMap.Expert).toBe(3)
  })
})

describe('reverseDifficultyMap', () => {
  it('is the exact inverse of difficultyMap for every defined numeric value', () => {
    const levels: DifficultyLevel[] = ['Easy', 'Normal', 'Expert']
    for (const level of levels) {
      const numeric = difficultyMap[level]
      expect(numeric).toBeDefined()
      expect(reverseDifficultyMap[numeric as number]).toBe(level)
    }
  })

  it('has exactly 3 entries, one per non-"Any" difficulty level', () => {
    expect(Object.keys(reverseDifficultyMap)).toHaveLength(3)
  })

  it('returns undefined for a value with no corresponding difficulty level', () => {
    expect(reverseDifficultyMap[0]).toBeUndefined()
    expect(reverseDifficultyMap[99]).toBeUndefined()
  })
})
