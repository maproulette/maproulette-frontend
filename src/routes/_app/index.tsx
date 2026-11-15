import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Challenges } from '@/components/Pages/ExploreChallengesPage'
import { SORT_BY_VALUES } from '@/components/Pages/ExploreChallengesPage/FilterBar/filterTypes'

const challengesSearchSchema = z.object({
  viewMode: z.enum(['grid', 'list', 'grid-map']).optional().catch('grid-map'),
  difficulty: z.enum(['Any', 'Easy', 'Normal', 'Expert']).optional().catch('Any'),
  workOn: z
    .enum([
      'Anything',
      'Roads / Pedestrian / Cycleways',
      'Water',
      'Points / Areas of Interest',
      'Buildings',
      'Land Use / Administrative Boundaries',
      'Transit',
    ])
    .optional()
    .catch('Anything'),
  sortBy: z.enum(SORT_BY_VALUES).optional().catch('default'),
  global: z.boolean().optional().catch(undefined),
  osm_type: z.enum(['N', 'W', 'R']).optional(),
  osm_id: z.number().optional(),
})

export const Route = createFileRoute('/_app/')({
  validateSearch: challengesSearchSchema,
  staticData: { pageTitle: 'Explore Challenges' },
  head: () => ({
    meta: [
      {
        title: 'Challenges',
      },
    ],
  }),
  component: Challenges,
})
