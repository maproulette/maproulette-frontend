import type { TranslateFn } from '@/i18n'

export const getDifficultyLabel = (t: TranslateFn, difficulty: number) => {
  switch (difficulty) {
    case 1:
      return t({ id: 'common.easy', defaultMessage: 'Easy' })
    case 2:
      return t({ id: 'common.normal', defaultMessage: 'Normal' })
    case 3:
      return t({ id: 'common.expert', defaultMessage: 'Expert' })
    default:
      return t({ id: 'common.normal', defaultMessage: 'Normal' })
  }
}

export const getDifficultyColor = (difficulty: number) => {
  switch (difficulty) {
    case 1:
      return 'text-green-600'
    case 2:
      return 'text-yellow-600'
    case 3:
      return 'text-red-600'
    default:
      return 'text-yellow-600'
  }
}
