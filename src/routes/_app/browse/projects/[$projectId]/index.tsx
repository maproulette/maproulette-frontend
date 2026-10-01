import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/browse/projects/$projectId/')({
  beforeLoad: ({ params: { projectId } }) => {
    throw redirect({ to: '/project/$projectId', params: { projectId }, replace: true })
  },
})
