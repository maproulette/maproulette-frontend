import { FormCard, ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { useIntl } from '@/i18n'
import { TeamForm } from './TeamForm'

export const NewTeamPage = () => {
  const { t } = useIntl()
  return (
    <ManageFormLayout>
      <FormCard
        title={t('teams.newTeam.title', undefined, 'Create a team')}
        description={t(
          'teams.newTeam.description',
          undefined,
          'Fill in the information below to create your new team'
        )}
      >
        <TeamForm />
      </FormCard>
    </ManageFormLayout>
  )
}
