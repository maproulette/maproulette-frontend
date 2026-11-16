import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/admin/projects/')({
  beforeLoad: () => {
    throw redirect({ to: '/manage/projects', replace: true })
  },
})
