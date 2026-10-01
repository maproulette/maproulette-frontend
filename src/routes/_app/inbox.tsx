import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/inbox')({
  beforeLoad: () => {
    throw redirect({ to: '/notifications', replace: true })
  },
})
