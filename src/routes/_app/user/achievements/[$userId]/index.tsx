import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/user/achievements/$userId/')({
  beforeLoad: ({ params: { userId } }) => {
    throw redirect({ to: '/profile/$userId', params: { userId }, replace: true })
  },
})
