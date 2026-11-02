import { FormSection } from '@/components/ui/FormSection'
import { useIntl } from '@/i18n'
import type { Challenge } from '@/types/Challenge'
import type { ChallengeFormValues } from './challengeFormSchema'
import { DataSourceFields } from './DataSourceFields'
import { TaskDataReadOnly } from './TaskDataReadOnly'

interface TaskDataSectionProps {
  dataSource: ChallengeFormValues['dataSource']
  challenge?: Challenge
  // The data source can be set while creating, or while an existing challenge
  // still has no tasks. Once tasks are built from it, it's shown read-only
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
      title={t({ id: 'manageChallengeNew.challengeForm.taskDataTitle', defaultMessage: 'Task data' })}
      description={
        sourceReadOnly
          ? t({ id: 'manageChallengeNew.challengeForm.taskDataReadOnlyDescription', defaultMessage: 'The data source is set when the challenge is created. To regenerate tasks from updated data, use Rebuild Tasks when managing the challenge.' }
            )
          : t({ id: 'manageChallengeNew.challengeForm.taskDataDescription', defaultMessage: 'Choose how you want to provide task data for this challenge.' }
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
