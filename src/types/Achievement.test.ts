import { describe, expect, it } from 'vitest'
import { Achievement, achievementDefinitions, getAchievement } from './Achievement.ts'

describe('achievementDefinitions', () => {
  it('has one definition per achievement id', () => {
    expect(achievementDefinitions).toHaveLength(Object.keys(Achievement).length)
  })

  it('gives every definition a translatable title and description', () => {
    for (const definition of achievementDefinitions) {
      expect(definition.title.id).toMatch(/^achievement\..+\.title$/)
      expect(definition.description.id).toMatch(/^achievement\..+\.description$/)
    }
  })
})

describe('Achievement', () => {
  it('uses the ids the backend awards', () => {
    expect(Achievement).toMatchObject({
      mappedRoads: 1,
      mappedPoi: 6,
      points100: 7,
      points500: 8,
      points1m: 15,
      fixedTask: 16,
      createdChallenge: 18,
      fixedFinalTask: 19,
      fixedCoopTask: 20,
      challengeCompleted: 21,
    })
  })
})

describe('getAchievement', () => {
  it('returns the matching definition for a known id', () => {
    const result = getAchievement(Achievement.fixedTask)

    expect(result).toBeDefined()
    expect(result?.title.id).toBe('achievement.fixedTask.title')
  })

  it('has no badge for reviewing a task', () => {
    expect(getAchievement(17)).toBeUndefined()
  })

  it('returns undefined for an unknown id', () => {
    expect(getAchievement(-1)).toBeUndefined()
  })
})
