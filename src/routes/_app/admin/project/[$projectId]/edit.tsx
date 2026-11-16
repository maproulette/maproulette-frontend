import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/admin/project/$projectId/edit')({
  beforeLoad: ({ params: { projectId } }) => {
    throw redirect({ to: '/manage/project/$projectId/edit', params: { projectId }, replace: true })
  },
})
