import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/admin/project/$projectId/')({
  beforeLoad: ({ params: { projectId } }) => {
    throw redirect({ to: '/manage/project/$projectId', params: { projectId }, replace: true })
  },
})
