import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/browse/challenges/$challengeId/')({
  beforeLoad: ({ params: { challengeId } }) => {
    throw redirect({ to: '/challenge/$challengeId', params: { challengeId }, replace: true })
  },
})
