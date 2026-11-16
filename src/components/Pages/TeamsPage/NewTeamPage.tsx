import { FormCard, ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { useIntl } from '@/i18n'
import { TeamForm } from './TeamForm'

export const NewTeamPage = () => {
  const { t } = useIntl()
  return (
    <ManageFormLayout>
      <FormCard title={t({ id: 'teams.newTeam.title', defaultMessage: 'Create a team' })}>
        <TeamForm />
      </FormCard>
    </ManageFormLayout>
  )
}
