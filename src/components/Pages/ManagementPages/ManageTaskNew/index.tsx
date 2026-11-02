import { FormCard, ManageFormLayout } from '@/components/shared/ManageFormLayout'
import { useIntl } from '@/i18n'

export const ManageTaskNew = () => {
  const { t } = useIntl()
  return (
    <ManageFormLayout>
      <FormCard
        title={t({ id: 'manageTaskNew.title', defaultMessage: 'New Task' })}
        description={t({
          id: 'manageTaskNew.description',
          defaultMessage: 'Task management functionality is under development',
        })}
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {t({
            id: 'manageTaskNew.body',
            defaultMessage:
              'Tasks are typically created in bulk through challenges. Individual task creation will be available in a future update.',
          })}
        </p>
      </FormCard>
    </ManageFormLayout>
  )
}
