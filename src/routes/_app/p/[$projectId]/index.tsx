import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/p/$projectId/')({
  beforeLoad: ({ params: { projectId } }) => {
    throw redirect({ to: '/project/$projectId', params: { projectId }, replace: true })
  },
})
