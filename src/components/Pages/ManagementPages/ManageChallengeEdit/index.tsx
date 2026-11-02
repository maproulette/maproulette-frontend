import { useParams } from '@tanstack/react-router'
import { ChallengeForm } from '@/components/Pages/ManagementPages/ManageChallengeNew/ChallengeForm'
import { FormCard, ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { EditChallengeFormProvider, useChallengeFormContext } from '@/contexts/ChallengeFormContext'
import { useIntl } from '@/i18n'

const EditChallengeLayout = () => {
  const { t } = useIntl()
  const { isLoading } = useChallengeFormContext()

  return (
    <ManageFormLayout>
      <FormCard
        title={t({ id: 'manageChallengeEdit.pageTitle', defaultMessage: 'Challenge Editor' })}
        description={t({ id: 'manageChallengeEdit.pageDescription', defaultMessage: 'Modify the information below to update your challenge' }
        )}
        isLoading={isLoading}
      >
        <ChallengeForm />
      </FormCard>
    </ManageFormLayout>
  )
}

export const ManageChallengeEdit = () => {
  const { challengeId } = useParams({ from: '/_app/manage/challenge/$challengeId/edit' })
  return (
    <EditChallengeFormProvider challengeId={Number(challengeId)}>
      <EditChallengeLayout />
    </EditChallengeFormProvider>
  )
}
