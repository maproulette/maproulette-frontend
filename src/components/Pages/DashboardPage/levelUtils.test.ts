import { describe, expect, it } from 'vitest'
import {
  calculateLevel,
  calculateNextLevelProgress,
  getAllLevelMilestones,
  getLevelInfo,
  getScoreForLevel,
} from './levelUtils'

describe('calculateLevel', () => {
  it('returns level 1 for a score of 0', () => {
    expect(calculateLevel(0)).toBe(1)
  })

  it('floors the sqrt(score / 10) result', () => {
    // sqrt(90 / 10) = 3, sqrt(99/10) ~= 3.146
    expect(calculateLevel(90)).toBe(3)
    expect(calculateLevel(99)).toBe(3)
  })

  it('reaches level 2 exactly at the score threshold of 40', () => {
    expect(calculateLevel(39)).toBe(1)
    expect(calculateLevel(40)).toBe(2)
  })

  it('calculates high scores correctly', () => {
    // sqrt(1000000 / 10) = sqrt(100000) ~= 316.22
    expect(calculateLevel(1000000)).toBe(316)
  })
})

describe('getScoreForLevel', () => {
  it('returns 0 for level 0', () => {
    expect(getScoreForLevel(0)).toBe(0)
  })

  it('returns level^2 * 10', () => {
    expect(getScoreForLevel(1)).toBe(10)
    expect(getScoreForLevel(2)).toBe(40)
    expect(getScoreForLevel(10)).toBe(1000)
  })

  it('is the inverse of calculateLevel at exact thresholds', () => {
    for (const level of [1, 2, 3, 10, 50]) {
      const score = getScoreForLevel(level)
      expect(calculateLevel(score)).toBe(level)
    }
  })
})

describe('calculateNextLevelProgress', () => {
  it('returns 0% right at the start of a level', () => {
    // Level 1 starts at score 10
    expect(calculateNextLevelProgress(10)).toBe(0)
  })

  it('returns 50% halfway between two level thresholds', () => {
    // Level 1 -> 2 spans score 10 to 40 (a range of 30); halfway is 25
    expect(calculateNextLevelProgress(25)).toBe(50)
  })

  it('approaches 100% just before the next level threshold', () => {
    // Level 1 -> 2 spans 10 to 40; score 39 is just under the boundary
    const progress = calculateNextLevelProgress(39)
    expect(progress).toBeGreaterThan(95)
    expect(progress).toBeLessThan(100)
  })

  it('never returns a progress value above 100, across a wide span of scores', () => {
    for (const score of [0, 5, 10, 39, 40, 89, 90, 999, 1000, 999999, 1000000, 5000000]) {
      expect(calculateNextLevelProgress(score)).toBeLessThanOrEqual(100)
    }
  })

  it('clamps to 0% for scores below 10, since calculateLevel clamps to a minimum level of 1 while getScoreForLevel(1) is 10', () => {
    // calculateLevel(0..9) is clamped to 1 via Math.max(1, ...), but level 1's
    // own threshold (getScoreForLevel(1) = 10) is higher than these scores, so
    // the raw progress-to-next-level calculation would go negative; it is clamped
    // to 0 so brand-new users (score 0) don't see negative progress.
    expect(calculateNextLevelProgress(0)).toBe(0)
    expect(calculateNextLevelProgress(9)).toBe(0)
  })

  it('handles a score of 0 without producing NaN', () => {
    const progress = calculateNextLevelProgress(0)
    expect(Number.isNaN(progress)).toBe(false)
  })
})

describe('getLevelInfo', () => {
  it('returns New Recruit for level 0 (below the lowest milestone)', () => {
    expect(getLevelInfo(0)).toEqual({ title: 'New Recruit', emoji: '🌱' })
  })

  it('returns the exact title/emoji at each milestone boundary', () => {
    expect(getLevelInfo(5)).toEqual({ title: 'Apprentice Mapper', emoji: '🔰' })
    expect(getLevelInfo(10)).toEqual({ title: 'Rising Scout', emoji: '🎒' })
    expect(getLevelInfo(20)).toEqual({ title: 'Seasoned Traveler', emoji: '🚶' })
    expect(getLevelInfo(30)).toEqual({ title: 'Dedicated Mapper', emoji: '🗃️' })
    expect(getLevelInfo(40)).toEqual({ title: 'Skilled Surveyor', emoji: '📍' })
    expect(getLevelInfo(50)).toEqual({ title: 'Senior Cartographer', emoji: '📐' })
    expect(getLevelInfo(60)).toEqual({ title: 'Expert Explorer', emoji: '🧭' })
    expect(getLevelInfo(70)).toEqual({ title: 'Veteran Pathfinder', emoji: '🎖️' })
    expect(getLevelInfo(80)).toEqual({ title: 'Master Navigator', emoji: '🗺️' })
    expect(getLevelInfo(90)).toEqual({ title: 'Elite Commander', emoji: '⚡' })
    expect(getLevelInfo(100)).toEqual({ title: 'Legendary Cartographer', emoji: '🌟' })
    expect(getLevelInfo(120)).toEqual({ title: 'Grand Master', emoji: '💎' })
    expect(getLevelInfo(150)).toEqual({ title: 'Mythical Explorer', emoji: '🔱' })
    expect(getLevelInfo(200)).toEqual({ title: 'Divine Pathfinder', emoji: '✨' })
    expect(getLevelInfo(250)).toEqual({ title: 'Cosmic Navigator', emoji: '🌌' })
    expect(getLevelInfo(316)).toEqual({ title: 'Transcendent Cartographer', emoji: '👑' })
  })

  it('returns the title for the highest milestone not yet exceeded (just below a boundary)', () => {
    expect(getLevelInfo(4)).toEqual({ title: 'New Recruit', emoji: '🌱' })
    expect(getLevelInfo(9)).toEqual({ title: 'Apprentice Mapper', emoji: '🔰' })
    expect(getLevelInfo(315)).toEqual({ title: 'Cosmic Navigator', emoji: '🌌' })
  })

  it('caps out at the highest title for levels far beyond the last milestone', () => {
    expect(getLevelInfo(10000)).toEqual({ title: 'Transcendent Cartographer', emoji: '👑' })
  })
})

describe('getAllLevelMilestones', () => {
  it('returns 17 milestones in ascending level order', () => {
    const milestones = getAllLevelMilestones()
    expect(milestones).toHaveLength(17)

    const levels = milestones.map((m) => m.level)
    const sortedLevels = [...levels].sort((a, b) => a - b)
    expect(levels).toEqual(sortedLevels)
  })

  it('includes the first and last milestone with correct required scores', () => {
    const milestones = getAllLevelMilestones()
    const first = milestones[0]
    const last = milestones[milestones.length - 1]

    expect(first).toEqual({
      level: 1,
      title: 'New Recruit',
      emoji: '🌱',
      requiredScore: getScoreForLevel(1),
    })
    expect(last).toEqual({
      level: 316,
      title: 'Transcendent Cartographer',
      emoji: '👑',
      requiredScore: getScoreForLevel(316),
    })
  })

  it('derives requiredScore for every milestone from getScoreForLevel', () => {
    const milestones = getAllLevelMilestones()
    for (const milestone of milestones) {
      expect(milestone.requiredScore).toBe(getScoreForLevel(milestone.level))
    }
  })
})
