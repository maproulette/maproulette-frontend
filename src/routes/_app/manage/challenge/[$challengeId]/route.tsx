import { createFileRoute } from '@tanstack/react-router'
import { requireIds } from '@/lib/routeParams'

export const Route = createFileRoute('/_app/manage/challenge/$challengeId')({
  loader: ({ params }) => requireIds(params),
  head: () => ({
    meta: [
      {
        title: 'Challenge',
      },
    ],
  }),
})
