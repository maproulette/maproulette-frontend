/**
 * Utility functions for calculating user levels and experience
 */

export interface LevelInfo {
  level: number
  title: string
  emoji: string
  requiredScore: number
}

/**
 * Calculate mapper level based on score
 * Level formula: sqrt(score / 10)
 */
export const calculateLevel = (score: number): number => {
  return Math.max(1, Math.floor(Math.sqrt(score / 10)))
}

/**
 * Calculate progress towards next level as a percentage
 */
export const calculateNextLevelProgress = (score: number): number => {
  const currentLevel = calculateLevel(score)
  const currentLevelThreshold = currentLevel ** 2 * 10
  const nextLevelThreshold = (currentLevel + 1) ** 2 * 10
  const progress =
    ((score - currentLevelThreshold) / (nextLevelThreshold - currentLevelThreshold)) * 100
  return Math.min(Math.max(progress, 0), 100)
}

/**
 * Get the score required for a specific level
 */
export const getScoreForLevel = (level: number): number => {
  return level ** 2 * 10
}

/**
 * Get level title and emoji based on level number
 */
export const getLevelInfo = (level: number): { title: string; emoji: string } => {
  // Specific milestones with unique titles
  if (level >= 316) return { title: 'Transcendent Cartographer', emoji: '👑' }
  if (level >= 250) return { title: 'Cosmic Navigator', emoji: '🌌' }
  if (level >= 200) return { title: 'Divine Pathfinder', emoji: '✨' }
  if (level >= 150) return { title: 'Mythical Explorer', emoji: '🔱' }
  if (level >= 120) return { title: 'Grand Master', emoji: '💎' }
  if (level >= 100) return { title: 'Legendary Cartographer', emoji: '🌟' }
  if (level >= 90) return { title: 'Elite Commander', emoji: '⚡' }
  if (level >= 80) return { title: 'Master Navigator', emoji: '🗺️' }
  if (level >= 70) return { title: 'Veteran Pathfinder', emoji: '🎖️' }
  if (level >= 60) return { title: 'Expert Explorer', emoji: '🧭' }
  if (level >= 50) return { title: 'Senior Cartographer', emoji: '📐' }
  if (level >= 40) return { title: 'Skilled Surveyor', emoji: '📍' }
  if (level >= 30) return { title: 'Dedicated Mapper', emoji: '🗃️' }
  if (level >= 20) return { title: 'Seasoned Traveler', emoji: '🚶' }
  if (level >= 10) return { title: 'Rising Scout', emoji: '🎒' }
  if (level >= 5) return { title: 'Apprentice Mapper', emoji: '🔰' }
  return { title: 'New Recruit', emoji: '🌱' }
}

/**
 * Get all level milestones for display
 */
export const getAllLevelMilestones = (): LevelInfo[] => {
  // Define specific milestone levels with unique titles
  const milestoneData: Array<{ level: number; title: string; emoji: string }> = [
    { level: 1, title: 'New Recruit', emoji: '🌱' },
    { level: 5, title: 'Apprentice Mapper', emoji: '🔰' },
    { level: 10, title: 'Rising Scout', emoji: '🎒' },
    { level: 20, title: 'Seasoned Traveler', emoji: '🚶' },
    { level: 30, title: 'Dedicated Mapper', emoji: '🗃️' },
    { level: 40, title: 'Skilled Surveyor', emoji: '📍' },
    { level: 50, title: 'Senior Cartographer', emoji: '📐' },
    { level: 60, title: 'Expert Explorer', emoji: '🧭' },
    { level: 70, title: 'Veteran Pathfinder', emoji: '🎖️' },
    { level: 80, title: 'Master Navigator', emoji: '🗺️' },
    { level: 90, title: 'Elite Commander', emoji: '⚡' },
    { level: 100, title: 'Legendary Cartographer', emoji: '🌟' },
    { level: 120, title: 'Grand Master', emoji: '💎' },
    { level: 150, title: 'Mythical Explorer', emoji: '🔱' },
    { level: 200, title: 'Divine Pathfinder', emoji: '✨' },
    { level: 250, title: 'Cosmic Navigator', emoji: '🌌' },
    { level: 316, title: 'Transcendent Cartographer', emoji: '👑' }, // ~1,000,000 points
  ]

  return milestoneData.map((milestone) => ({
    level: milestone.level,
    title: milestone.title,
    emoji: milestone.emoji,
    requiredScore: getScoreForLevel(milestone.level),
  }))
}
