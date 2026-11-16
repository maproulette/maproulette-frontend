import { createFileRoute } from '@tanstack/react-router'
import { NewTeamPage } from '@/components/Pages/TeamsPage/NewTeamPage'

export const Route = createFileRoute('/_app/teams/new')({
  staticData: { pageTitle: 'New Team' },
  head: () => ({ meta: [{ title: 'New Team' }] }),
  component: NewTeamPage,
})
