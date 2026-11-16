import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { TeamDetailPage } from '@/components/Pages/TeamsPage/TeamDetailPage'
import { TEAM_SECTIONS } from '@/components/Pages/TeamsPage/TeamDetailPage/TeamContentPanel'

// Which of the team's lists is on show. In the url so a particular view of a
// team can be linked, refreshed and gone back to. Named `section` rather than
// the obvious `tab` because TanStack merges every route's search schema into
// one type, and `/tasks/$taskId` already spends `tab` on a different enum.
const teamSearchSchema = z.object({
  section: z.enum(TEAM_SECTIONS).optional(),
})

const TeamDetail = () => {
  const { teamId } = Route.useParams()
  return <TeamDetailPage teamId={Number(teamId)} />
}

export const Route = createFileRoute('/_app/teams/$teamId/')({
  validateSearch: teamSearchSchema,
  staticData: { pageTitle: 'Team' },
  head: () => ({ meta: [{ title: 'Team' }] }),
  component: TeamDetail,
})
