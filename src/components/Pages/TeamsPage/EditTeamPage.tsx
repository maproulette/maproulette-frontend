import { api } from '@/api'
import { FormCard, ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { Loader } from '@/components/ui/Loader'
import { useIntl } from '@/i18n'
import { TeamForm } from './TeamForm'

interface Props {
  teamId: number
}

export const EditTeamPage = ({ teamId }: Props) => {
  const { t } = useIntl()
  const { data: team, isLoading } = api.team.get(teamId)

  if (isLoading) return <Loader />
  if (!team)
    return (
      <div className="py-12 text-center text-zinc-500">
        {t('common.teamNotFound', undefined, 'Team not found.')}
      </div>
    )

  return (
    <ManageFormLayout>
      <FormCard
        title={t('teams.editTeam.title', undefined, 'Edit team')}
        description={t(
          'teams.editTeam.description',
          undefined,
          'Update the information for this team'
        )}
      >
        <TeamForm team={team} />
      </FormCard>
    </ManageFormLayout>
  )
}
