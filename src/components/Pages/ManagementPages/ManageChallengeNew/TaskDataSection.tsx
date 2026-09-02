import { FormSection } from '@/components/ui/FormSection'
import { useIntl } from '@/i18n'
import type { Challenge } from '@/types/Challenge'
import type { ChallengeFormValues } from './challengeFormSchema'
import { DataSourceFields } from './DataSourceFields'
import { TaskDataReadOnly } from './TaskDataReadOnly'

interface TaskDataSectionProps {
  dataSource: ChallengeFormValues['dataSource']
  challenge?: Challenge
  // The data source can only be set while creating. Once a challenge exists,
  // its tasks are already built from that source, so it's shown read-only
  // here (matching MR3) — regenerating tasks is done via Rebuild Tasks
  // instead.
  sourceReadOnly: boolean
}

export const TaskDataSection = ({
  dataSource,
  challenge,
  sourceReadOnly,
}: TaskDataSectionProps) => {
  const { t } = useIntl()

  return (
    <FormSection
      title={t('manageChallengeNew.challengeForm.taskDataTitle', undefined, 'Task data')}
      description={
        sourceReadOnly
          ? t(
              'manageChallengeNew.challengeForm.taskDataReadOnlyDescription',
              undefined,
              'The data source is set when the challenge is created. To regenerate tasks from updated data, use Rebuild Tasks when managing the challenge.'
            )
          : t(
              'manageChallengeNew.challengeForm.taskDataDescription',
              undefined,
              'Choose how you want to provide task data for this challenge.'
            )
      }
    >
      {sourceReadOnly ? (
        <TaskDataReadOnly dataSource={dataSource} challenge={challenge} />
      ) : (
        <DataSourceFields dataSource={dataSource} />
      )}
    </FormSection>
  )
}
