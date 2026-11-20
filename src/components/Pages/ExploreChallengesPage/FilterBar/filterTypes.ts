export const DIFFICULTY_LEVELS = ['Any', 'Easy', 'Normal', 'Expert'] as const

export type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]

export const WORK_ON_CATEGORIES = [
  'Anything',
  'Roads / Pedestrian / Cycleways',
  'Water',
  'Points / Areas of Interest',
  'Buildings',
  'Land Use / Administrative Boundaries',
  'Transit',
] as const

export type WorkOnCategory = (typeof WORK_ON_CATEGORIES)[number]

export const VIEW_MODES = ['grid', 'list', 'grid-map'] as const

export type ViewMode = (typeof VIEW_MODES)[number]

/** Sort orders offered on the explore page; the endpoint accepts a few more. */
export const SORT_BY_VALUES = [
  'default',
  'popularity',
  'created',
  'oldest',
  'name',
  'difficulty',
] as const

export type SortBy = (typeof SORT_BY_VALUES)[number]
