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
      return 'text-success'
    case 2:
      return 'text-warning'
    case 3:
      return 'text-danger'
    default:
      return 'text-warning'
  }
}

export const getDifficultyBadgeColor = (difficulty: number) => {
  switch (difficulty) {
    case 1:
      return 'border-transparent bg-mint-200 text-mint-800 dark:border-mint-400/50 dark:bg-transparent dark:text-mint-400'
    case 3:
      return 'border-transparent bg-coral-200 text-coral-800 dark:border-coral-400/50 dark:bg-transparent dark:text-coral-400'
    default:
      return 'border-transparent bg-mango-200 text-mango-800 dark:border-mango-400/50 dark:bg-transparent dark:text-mango-400'
  }
}
