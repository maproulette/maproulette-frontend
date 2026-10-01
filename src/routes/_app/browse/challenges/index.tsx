import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/browse/challenges/')({
  beforeLoad: () => {
    throw redirect({ to: '/', replace: true })
  },
})
