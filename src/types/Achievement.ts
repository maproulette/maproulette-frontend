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

export type AchievementCategory = 'taskCompletion' | 'mapping' | 'creation' | 'pointsMilestone'

export interface AchievementDefinition {
  id: AchievementId
  category: AchievementCategory
  title: string
  description: string
  icon: LucideIcon
  overlay?: string
}

export const achievementDefinitions: AchievementDefinition[] = [
  {
    id: Achievement.fixedTask,
    category: 'taskCompletion',
    title: 'First Fix',
    description: 'Completed your first task.',
    icon: Wrench,
  },
  {
    id: Achievement.fixedCoopTask,
    category: 'taskCompletion',
    title: 'Cooperative Fixer',
    description: 'Completed a cooperative task.',
    icon: Wrench,
  },
  {
    id: Achievement.challengeCompleted,
    category: 'taskCompletion',
    title: 'Challenge Champion',
    description: 'Completed every task in a challenge.',
    icon: Flag,
  },
  {
    id: Achievement.fixedFinalTask,
    category: 'taskCompletion',
    title: 'Closer',
    description: 'Finished the final task in a challenge.',
    icon: CheckCircle2,
  },
  {
    id: Achievement.mappedRoads,
    category: 'mapping',
    title: 'Road Warrior',
    description: 'Contributed to mapping roads.',
    icon: Route,
  },
  {
    id: Achievement.mappedWater,
    category: 'mapping',
    title: 'Waterways',
    description: 'Contributed to mapping water features.',
    icon: Waves,
  },
  {
    id: Achievement.mappedTransit,
    category: 'mapping',
    title: 'Transit Mapper',
    description: 'Contributed to mapping transit.',
    icon: Ship,
  },
  {
    id: Achievement.mappedLanduse,
    category: 'mapping',
    title: 'Land Use',
    description: 'Contributed to mapping land use.',
    icon: Leaf,
  },
  {
    id: Achievement.mappedBuildings,
    category: 'mapping',
    title: 'Building Blocks',
    description: 'Contributed to mapping buildings.',
    icon: Building2,
  },
  {
    id: Achievement.mappedPoi,
    category: 'mapping',
    title: 'Landmark Spotter',
    description: 'Contributed to mapping points of interest.',
    icon: Landmark,
  },
  {
    id: Achievement.createdChallenge,
    category: 'creation',
    title: 'Challenge Creator',
    description: 'Created a challenge.',
    icon: PenTool,
  },
  {
    id: Achievement.points100,
    category: 'pointsMilestone',
    title: '100 Points',
    description: 'Earned 100 points.',
    icon: Star,
    overlay: '100',
  },
  {
    id: Achievement.points500,
    category: 'pointsMilestone',
    title: '500 Points',
    description: 'Earned 500 points.',
    icon: Star,
    overlay: '500',
  },
  {
    id: Achievement.points1000,
    category: 'pointsMilestone',
    title: '1,000 Points',
    description: 'Earned 1,000 points.',
    icon: Award,
    overlay: '1K',
  },
  {
    id: Achievement.points5000,
    category: 'pointsMilestone',
    title: '5,000 Points',
    description: 'Earned 5,000 points.',
    icon: Award,
    overlay: '5K',
  },
  {
    id: Achievement.points10000,
    category: 'pointsMilestone',
    title: '10,000 Points',
    description: 'Earned 10,000 points.',
    icon: Trophy,
    overlay: '10K',
  },
  {
    id: Achievement.points50000,
    category: 'pointsMilestone',
    title: '50,000 Points',
    description: 'Earned 50,000 points.',
    icon: Trophy,
    overlay: '50K',
  },
  {
    id: Achievement.points100k,
    category: 'pointsMilestone',
    title: '100,000 Points',
    description: 'Earned 100,000 points.',
    icon: Mountain,
    overlay: '100K',
  },
  {
    id: Achievement.points500k,
    category: 'pointsMilestone',
    title: '500,000 Points',
    description: 'Earned 500,000 points.',
    icon: Mountain,
    overlay: '500K',
  },
  {
    id: Achievement.points1m,
    category: 'pointsMilestone',
    title: '1,000,000 Points',
    description: 'Earned a million points.',
    icon: Crown,
    overlay: '1M',
  },
]

export const achievementCategoryLabel: Record<AchievementCategory, string> = {
  taskCompletion: 'Task Completion',
  mapping: 'Mapping',
  creation: 'Creation',
  pointsMilestone: 'Points Milestones',
}

export const getAchievement = (id: number): AchievementDefinition | undefined =>
  achievementDefinitions.find((a) => a.id === id)
