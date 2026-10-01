import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/t/$taskId/')({
  beforeLoad: ({ params: { taskId } }) => {
    throw redirect({ to: '/tasks/$taskId', params: { taskId }, replace: true })
  },
})
