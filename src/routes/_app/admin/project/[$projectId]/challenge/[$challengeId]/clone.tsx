import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/admin/project/$projectId/challenge/$challengeId/clone')(
  {
    beforeLoad: ({ params: { projectId, challengeId } }) => {
      throw redirect({
        to: '/manage/challenge/new',
        search: { projectId: Number(projectId), cloneFrom: Number(challengeId) },
        replace: true,
      })
    },
  }
)
