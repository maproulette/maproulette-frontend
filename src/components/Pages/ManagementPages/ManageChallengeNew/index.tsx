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
              ? t('common.cloneChallenge', undefined, 'Clone Challenge')
              : t('common.createNewChallenge', undefined, 'Create New Challenge')
          }
          description={t(
            'manageChallengeNew.pageDescription',
            undefined,
            'Fill in the information below to create your new challenge'
          )}
        >
          <ChallengeForm />
        </FormCard>
      </ManageFormLayout>
    </CreateChallengeFormProvider>
  )
}
