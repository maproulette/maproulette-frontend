export type DifficultyLevel = 'Any' | 'Easy' | 'Normal' | 'Expert'

export type WorkOnCategory =
  | 'Anything'
  | 'Roads / Pedestrian / Cycleways'
  | 'Water'
  | 'Points / Areas of Interest'
  | 'Buildings'
  | 'Land Use / Administrative Boundaries'
  | 'Transit'

export type ViewMode = 'grid' | 'list' | 'grid-map'

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
