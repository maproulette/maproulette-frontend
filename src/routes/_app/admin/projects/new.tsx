import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/admin/projects/new')({
  beforeLoad: () => {
    throw redirect({ to: '/manage/project/new', replace: true })
  },
})
