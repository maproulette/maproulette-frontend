import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { Challenges } from '@/components/Pages/ExploreChallengesPage'

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
  categories: z.string().optional(), // comma-separated string
  sortBy: z
    .enum([
      'name',
      'created',
      'modified',
      'popularity',
      'difficulty',
      'featured',
      'tag_fix',
      'cooperative',
    ])
    .optional()
    .catch('name'),
  global: z.boolean().optional().catch(false),
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
