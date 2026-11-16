import type { LucideIcon } from 'lucide-react'
import {
  Award,
  Building2,
  CheckCircle2,
  Crown,
  Flag,
  Landmark,
  Leaf,
  Mountain,
  PenTool,
  Route,
  Ship,
  Star,
  Trophy,
  Waves,
  Wrench,
} from 'lucide-react'
import { defineMessage, type MessageDescriptor } from 'react-intl'

export const Achievement = {
  mappedRoads: 1,
  mappedWater: 2,
  mappedTransit: 3,
  mappedLanduse: 4,
  mappedBuildings: 5,
  mappedPoi: 6,
  points100: 7,
  points500: 8,
  points1000: 9,
  points5000: 10,
  points10000: 11,
  points50000: 12,
  points100k: 13,
  points500k: 14,
  points1m: 15,
  fixedTask: 16,
  createdChallenge: 18,
  fixedFinalTask: 19,
  fixedCoopTask: 20,
  challengeCompleted: 21,
} as const

type AchievementId = (typeof Achievement)[keyof typeof Achievement]

export interface AchievementDefinition {
  id: AchievementId
  title: MessageDescriptor
  description: MessageDescriptor
  icon: LucideIcon
  overlay?: string
}

export const achievementDefinitions: AchievementDefinition[] = [
  {
    id: Achievement.fixedTask,
    title: defineMessage({ id: 'achievement.fixedTask.title', defaultMessage: 'First Fix' }),
    description: defineMessage({
      id: 'achievement.fixedTask.description',
      defaultMessage: 'Fixed your first task.',
    }),
    icon: Wrench,
  },
  {
    id: Achievement.fixedCoopTask,
    title: defineMessage({
      id: 'achievement.fixedCoopTask.title',
      defaultMessage: 'Cooperative Fixer',
    }),
    description: defineMessage({
      id: 'achievement.fixedCoopTask.description',
      defaultMessage: 'Fixed a cooperative task.',
    }),
    icon: Wrench,
  },
  {
    id: Achievement.challengeCompleted,
    title: defineMessage({
      id: 'achievement.challengeCompleted.title',
      defaultMessage: 'Finished Together',
    }),
    description: defineMessage({
      id: 'achievement.challengeCompleted.description',
      defaultMessage: 'Fixed a task in a challenge that was completed.',
    }),
    icon: Flag,
  },
  {
    id: Achievement.fixedFinalTask,
    title: defineMessage({ id: 'achievement.fixedFinalTask.title', defaultMessage: 'Closer' }),
    description: defineMessage({
      id: 'achievement.fixedFinalTask.description',
      defaultMessage: 'Finished the final task in a challenge.',
    }),
    icon: CheckCircle2,
  },
  {
    id: Achievement.mappedRoads,
    title: defineMessage({ id: 'achievement.mappedRoads.title', defaultMessage: 'Road Warrior' }),
    description: defineMessage({
      id: 'achievement.mappedRoads.description',
      defaultMessage: 'Contributed to mapping roads.',
    }),
    icon: Route,
  },
  {
    id: Achievement.mappedWater,
    title: defineMessage({ id: 'achievement.mappedWater.title', defaultMessage: 'Waterways' }),
    description: defineMessage({
      id: 'achievement.mappedWater.description',
      defaultMessage: 'Contributed to mapping water features.',
    }),
    icon: Waves,
  },
  {
    id: Achievement.mappedTransit,
    title: defineMessage({
      id: 'achievement.mappedTransit.title',
      defaultMessage: 'Transit Mapper',
    }),
    description: defineMessage({
      id: 'achievement.mappedTransit.description',
      defaultMessage: 'Contributed to mapping transit.',
    }),
    icon: Ship,
  },
  {
    id: Achievement.mappedLanduse,
    title: defineMessage({ id: 'achievement.mappedLanduse.title', defaultMessage: 'Land Use' }),
    description: defineMessage({
      id: 'achievement.mappedLanduse.description',
      defaultMessage: 'Contributed to mapping land use.',
    }),
    icon: Leaf,
  },
  {
    id: Achievement.mappedBuildings,
    title: defineMessage({
      id: 'achievement.mappedBuildings.title',
      defaultMessage: 'Building Blocks',
    }),
    description: defineMessage({
      id: 'achievement.mappedBuildings.description',
      defaultMessage: 'Contributed to mapping buildings.',
    }),
    icon: Building2,
  },
  {
    id: Achievement.mappedPoi,
    title: defineMessage({
      id: 'achievement.mappedPoi.title',
      defaultMessage: 'Landmark Spotter',
    }),
    description: defineMessage({
      id: 'achievement.mappedPoi.description',
      defaultMessage: 'Contributed to mapping points of interest.',
    }),
    icon: Landmark,
  },
  {
    id: Achievement.createdChallenge,
    title: defineMessage({
      id: 'achievement.createdChallenge.title',
      defaultMessage: 'Challenge Creator',
    }),
    description: defineMessage({
      id: 'achievement.createdChallenge.description',
      defaultMessage: 'Created a challenge.',
    }),
    icon: PenTool,
  },
  {
    id: Achievement.points100,
    title: defineMessage({ id: 'achievement.points100.title', defaultMessage: '100 Points' }),
    description: defineMessage({
      id: 'achievement.points100.description',
      defaultMessage: 'Earned 100 points.',
    }),
    icon: Star,
    overlay: '100',
  },
  {
    id: Achievement.points500,
    title: defineMessage({ id: 'achievement.points500.title', defaultMessage: '500 Points' }),
    description: defineMessage({
      id: 'achievement.points500.description',
      defaultMessage: 'Earned 500 points.',
    }),
    icon: Star,
    overlay: '500',
  },
  {
    id: Achievement.points1000,
    title: defineMessage({ id: 'achievement.points1000.title', defaultMessage: '1,000 Points' }),
    description: defineMessage({
      id: 'achievement.points1000.description',
      defaultMessage: 'Earned 1,000 points.',
    }),
    icon: Award,
    overlay: '1K',
  },
  {
    id: Achievement.points5000,
    title: defineMessage({ id: 'achievement.points5000.title', defaultMessage: '5,000 Points' }),
    description: defineMessage({
      id: 'achievement.points5000.description',
      defaultMessage: 'Earned 5,000 points.',
    }),
    icon: Award,
    overlay: '5K',
  },
  {
    id: Achievement.points10000,
    title: defineMessage({ id: 'achievement.points10000.title', defaultMessage: '10,000 Points' }),
    description: defineMessage({
      id: 'achievement.points10000.description',
      defaultMessage: 'Earned 10,000 points.',
    }),
    icon: Trophy,
    overlay: '10K',
  },
  {
    id: Achievement.points50000,
    title: defineMessage({ id: 'achievement.points50000.title', defaultMessage: '50,000 Points' }),
    description: defineMessage({
      id: 'achievement.points50000.description',
      defaultMessage: 'Earned 50,000 points.',
    }),
    icon: Trophy,
    overlay: '50K',
  },
  {
    id: Achievement.points100k,
    title: defineMessage({ id: 'achievement.points100k.title', defaultMessage: '100,000 Points' }),
    description: defineMessage({
      id: 'achievement.points100k.description',
      defaultMessage: 'Earned 100,000 points.',
    }),
    icon: Mountain,
    overlay: '100K',
  },
  {
    id: Achievement.points500k,
    title: defineMessage({ id: 'achievement.points500k.title', defaultMessage: '500,000 Points' }),
    description: defineMessage({
      id: 'achievement.points500k.description',
      defaultMessage: 'Earned 500,000 points.',
    }),
    icon: Mountain,
    overlay: '500K',
  },
  {
    id: Achievement.points1m,
    title: defineMessage({ id: 'achievement.points1m.title', defaultMessage: '1,000,000 Points' }),
    description: defineMessage({
      id: 'achievement.points1m.description',
      defaultMessage: 'Earned a million points.',
    }),
    icon: Crown,
    overlay: '1M',
  },
]

export const getAchievement = (id: number): AchievementDefinition | undefined =>
  achievementDefinitions.find((a) => a.id === id)
