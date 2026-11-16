import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/challenge/$challengeId/leaderboard')({
  beforeLoad: ({ params: { challengeId } }) => {
    throw redirect({ to: '/challenge/$challengeId', params: { challengeId }, replace: true })
  },
})
