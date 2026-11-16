import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/sent')({
  beforeLoad: () => {
    throw redirect({ to: '/notifications', replace: true })
  },
})
