import { createFileRoute } from '@tanstack/react-router'
import { requireIds } from '@/lib/routeParams'

export const Route = createFileRoute('/_app/teams/$teamId')({
  loader: ({ params }) => requireIds(params),
})
