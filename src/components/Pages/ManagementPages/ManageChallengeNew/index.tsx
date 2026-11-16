import { ChallengeForm } from '@/components/Pages/ManagementPages/ManageChallengeNew/ChallengeForm'
import { FormCard, ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { CreateChallengeFormProvider } from '@/contexts/ChallengeFormContext'
import { useIntl } from '@/i18n'

interface ManageChallengeNewProps {
  projectId?: number
  cloneFromChallengeId?: number
}

export const ManageChallengeNew = ({
  projectId,
  cloneFromChallengeId,
}: ManageChallengeNewProps) => {
  const { t } = useIntl()

  return (
    <CreateChallengeFormProvider projectId={projectId} cloneFromChallengeId={cloneFromChallengeId}>
      <ManageFormLayout>
        <FormCard
          title={
            cloneFromChallengeId
              ? t({ id: 'common.cloneChallenge', defaultMessage: 'Clone Challenge' })
              : t({ id: 'common.createNewChallenge', defaultMessage: 'Create New Challenge' })
          }
        >
          <ChallengeForm />
        </FormCard>
      </ManageFormLayout>
    </CreateChallengeFormProvider>
  )
}
