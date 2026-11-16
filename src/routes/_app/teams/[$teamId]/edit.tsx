import { createFileRoute } from '@tanstack/react-router'
import { EditTeamPage } from '@/components/Pages/TeamsPage/EditTeamPage'

const EditTeam = () => {
  const { teamId } = Route.useParams()
  return <EditTeamPage teamId={Number(teamId)} />
}

export const Route = createFileRoute('/_app/teams/$teamId/edit')({
  staticData: { pageTitle: 'Edit Team' },
  head: () => ({ meta: [{ title: 'Edit Team' }] }),
  component: EditTeam,
})
