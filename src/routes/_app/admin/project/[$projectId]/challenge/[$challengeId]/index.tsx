import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/admin/project/$projectId/challenge/$challengeId/')({
  beforeLoad: ({ params: { challengeId } }) => {
    throw redirect({ to: '/manage/challenge/$challengeId', params: { challengeId }, replace: true })
  },
})
