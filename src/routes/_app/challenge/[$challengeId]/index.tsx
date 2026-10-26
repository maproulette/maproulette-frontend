import { createFileRoute, notFound } from '@tanstack/react-router'
import { HTTPError } from 'ky'
import { z } from 'zod'
import { api } from '@/api'
import { BrowsedChallengePage } from '@/components/Pages/BrowsedChallengePage'
import { logger } from '@/lib/logger'

const challengeSearchSchema = z.object({
  comments: z.coerce.number().optional(), // 1 → auto-open comments modal
})

export const Route = createFileRoute('/_app/challenge/$challengeId/')({
  validateSearch: challengeSearchSchema,
  staticData: { pageTitle: 'Browse Challenge' },
  loader: async ({ params: { challengeId }, context: { queryClient }, preload }) => {
    const id = Number(challengeId)

    // Kick off the (often large, slow) task-marker fetch but DON'T await it —
    // the map reads the same query and shows its loading indicator while it
    // streams in. Skipped on hover-preload so browsing a challenge list doesn't
    // fire a marker request per hovered challenge. Only the challenge details
    // block navigation, as before.
    if (!preload) {
      void queryClient.prefetchQuery(api.challenge.getChallengeTaskMarkersOptions(id))
    }

    try {
      const challenge = await queryClient.ensureQueryData(api.challenge.getChallengeOptions(id))

      return { challenge }
    } catch (error) {
      if (error instanceof HTTPError && error.response.status === 404) {
        logger.error('Challenge not found', { challengeId, error })
        throw notFound()
      }
      throw error
    }
  },
  head: ({ loaderData }) => {
    const challenge = loaderData?.challenge

    return {
      meta: [
        {
          title: challenge?.name ? `Challenge: ${challenge.name}` : 'Loading challenge',
        },
      ],
    }
  },
  component: BrowsedChallengePage,
})
