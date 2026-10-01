import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/admin/project/$projectId/challenges/new')({
  beforeLoad: ({ params: { projectId } }) => {
    throw redirect({
      to: '/manage/challenge/new',
      search: { projectId: Number(projectId) },
      replace: true,
    })
  },
})
