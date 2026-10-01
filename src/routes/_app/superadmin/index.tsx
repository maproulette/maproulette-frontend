import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/superadmin/')({
  beforeLoad: () => {
    throw redirect({ to: '/super-admin', replace: true })
  },
})
