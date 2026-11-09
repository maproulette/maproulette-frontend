import { useParams, useSearch } from '@tanstack/react-router'
import { FormCard, ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { useIntl } from '@/i18n'
import { BulkEditProvider, useBulkEditContext } from './BulkEditContext'
import { BulkEditForm } from './BulkEditForm'

const BulkEditLayout = () => {
  const { t } = useIntl()
  const { isLoading } = useBulkEditContext()

  return (
    <ManageFormLayout>
      <FormCard
        title={t({
          id: 'manageChallengesBulkEdit.pageTitle',
          defaultMessage: 'Bulk Edit Challenges',
        })}
        description={t({
          id: 'manageChallengesBulkEdit.pageDescription',
          defaultMessage: 'Change several challenges in this project at once',
        })}
        isLoading={isLoading}
      >
        <BulkEditForm />
      </FormCard>
    </ManageFormLayout>
  )
}

export const ManageChallengesBulkEdit = () => {
  const { projectId } = useParams({ from: '/_app/manage/project/$projectId/challenges/bulk-edit' })
  const { challengeIds } = useSearch({
    from: '/_app/manage/project/$projectId/challenges/bulk-edit',
  })

  return (
    <BulkEditProvider projectId={Number(projectId)} challengeIds={challengeIds}>
      <BulkEditLayout />
    </BulkEditProvider>
  )
}
