import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/task/$taskId/')({
  beforeLoad: ({ params: { taskId } }) => {
    throw redirect({ to: '/tasks/$taskId', params: { taskId }, replace: true })
  },
})
