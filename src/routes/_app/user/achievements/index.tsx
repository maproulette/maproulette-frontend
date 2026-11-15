import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/user/achievements/')({
  beforeLoad: () => {
    throw redirect({ to: '/dashboard', replace: true })
  },
})
