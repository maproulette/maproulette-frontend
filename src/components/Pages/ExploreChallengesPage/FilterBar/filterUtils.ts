import type { DifficultyLevel, WorkOnCategory } from './filterTypes'

export const workOnCategoryMap: Record<WorkOnCategory, string[] | null> = {
  Anything: null,
  'Roads / Pedestrian / Cycleways': ['roads', 'pedestrian', 'cycleways', 'highway'],
  Water: ['water', 'waterway'],
  'Points / Areas of Interest': ['poi', 'amenity', 'leisure'],
  Buildings: ['buildings', 'building'],
  'Land Use / Administrative Boundaries': ['landuse', 'boundary', 'administrative'],
  Transit: ['transit', 'public_transport', 'railway'],
}

export const difficultyMap: Record<DifficultyLevel, 1 | 2 | 3 | undefined> = {
  Any: undefined,
  Easy: 1,
  Normal: 2,
  Expert: 3,
}

export const reverseDifficultyMap: Record<number, DifficultyLevel> = {
  1: 'Easy',
  2: 'Normal',
  3: 'Expert',
}
