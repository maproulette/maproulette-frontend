import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/admin/project/$projectId/challenge/$challengeId/edit')({
  beforeLoad: ({ params: { challengeId } }) => {
    throw redirect({
      to: '/manage/challenge/$challengeId/edit',
      params: { challengeId },
      replace: true,
    })
  },
})
