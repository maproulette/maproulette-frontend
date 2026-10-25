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
      className="gap-1.5 rounded-full border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-slate-600 dark:text-slate-400 dark:hover:bg-slate-700"
      title={withBindingHint(
        t(
          'taskEditPage.taskActions.skipButton.title',
          undefined,
          'Skip this task (preserves status)'
        ),
        SKIP_TASK_BINDING
      )}
    >
      {isSkipping ? (
        <Spinner size="sm" aria-hidden="true" />
      ) : (
        <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
      )}
      {t('taskEditPage.taskActions.skipButton.label', undefined, 'Skip this task')}
    </Button>
  )
}
