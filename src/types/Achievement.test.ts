import { describe, expect, it } from 'vitest'
import {
  Achievement,
  achievementCategoryLabel,
  achievementDefinitions,
  getAchievement,
} from './Achievement.ts'

describe('achievementDefinitions', () => {
  it('has one definition per achievement id', () => {
    expect(achievementDefinitions).toHaveLength(Object.keys(Achievement).length)
  })

  it('assigns every definition a label from achievementCategoryLabel', () => {
    for (const definition of achievementDefinitions) {
      expect(achievementCategoryLabel[definition.category]).toBeTruthy()
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
      reviewedTask: 17,
      createdChallenge: 18,
      fixedFinalTask: 19,
      fixedCoopTask: 20,
      challengeCompleted: 21,
    })
  })
})

describe('achievementCategoryLabel', () => {
  it('provides a human-readable label for every category', () => {
    expect(achievementCategoryLabel).toEqual({
      taskCompletion: 'Task Completion',
      mapping: 'Mapping',
      review: 'Review',
      creation: 'Creation',
      pointsMilestone: 'Points Milestones',
    })
  })
})

describe('getAchievement', () => {
  it('returns the matching definition for a known id', () => {
    const result = getAchievement(Achievement.fixedTask)

    expect(result).toBeDefined()
    expect(result?.title).toBe('First Fix')
  })

  it('returns undefined for an unknown id', () => {
    expect(getAchievement(-1)).toBeUndefined()
  })
})
