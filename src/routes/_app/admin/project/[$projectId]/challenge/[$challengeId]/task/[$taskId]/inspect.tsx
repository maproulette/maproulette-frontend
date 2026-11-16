import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/_app/admin/project/$projectId/challenge/$challengeId/task/$taskId/inspect'
)({
  beforeLoad: ({ params: { taskId } }) => {
    throw redirect({ to: '/tasks/$taskId', params: { taskId }, replace: true })
  },
})
