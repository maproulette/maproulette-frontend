import { useQuery } from '@tanstack/react-query'
import { teamOptions } from '@/api/team'
import { FormCard, ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { Loader } from '@/components/ui/Loader'
import { useIntl } from '@/i18n'
import { TeamForm } from './TeamForm'

interface Props {
  teamId: number
}

export const EditTeamPage = ({ teamId }: Props) => {
  const { t } = useIntl()
  const { data: team, isLoading } = useQuery(teamOptions(teamId))

  if (isLoading) return <Loader />
  if (!team)
    return (
      <div className="py-12 text-center text-fg-muted">
        {t({ id: 'common.teamNotFound', defaultMessage: 'Team not found.' })}
      </div>
    )

  return (
    <ManageFormLayout>
      <FormCard title={t({ id: 'teams.editTeam.title', defaultMessage: 'Edit team' })}>
        <TeamForm team={team} />
      </FormCard>
    </ManageFormLayout>
  )
}
