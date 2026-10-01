import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/admin/project/$projectId/challenge/$challengeId/task/$taskId/edit'
)({
  beforeLoad: ({ params: { taskId } }) => {
    throw redirect({ to: '/manage/task/$taskId/edit', params: { taskId }, replace: true })
  },
})
