import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/c/$challengeId/')({
  beforeLoad: ({ params: { challengeId } }) => {
    throw redirect({ to: '/challenge/$challengeId', params: { challengeId }, replace: true })
  },
})
