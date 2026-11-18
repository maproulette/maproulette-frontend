import { SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { useIntl } from '@/i18n'
import { withBindingHint } from '@/lib/keyboardShortcuts'
import type { Task } from '@/types/Task'
import { SKIP_TASK_BINDING } from '../useTaskShortcuts'
import { useSkipTask } from './useSkipTask'

export const SkipButton = ({ task }: { task: Task }) => {
  const { t } = useIntl()
  const { skipTask, isSkipping } = useSkipTask(task)

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={skipTask}
      disabled={isSkipping}
      className="gap-1.5 rounded-full border-line-strong text-fg-muted hover:bg-muted-strong"
      title={withBindingHint(
        t({
          id: 'taskEditPage.taskActions.skipButton.title',
          defaultMessage: 'Skip this task (preserves status)',
        }),
        SKIP_TASK_BINDING
      )}
    >
      {isSkipping ? (
        <Spinner size="sm" aria-hidden="true" />
      ) : (
        <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {t({ id: 'taskEditPage.taskActions.skipButton.label', defaultMessage: 'Skip this task' })}
    </Button>
  )
}
