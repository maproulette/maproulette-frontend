import { LockOpen } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useNavigateToTask } from '@/hooks/useNavigateToTask'
import { useIntl } from '@/i18n'
import type { LockConflictInfo } from '@/lib/apiError'
import { formatTimeAgo } from '@/lib/date'

interface Props {
  conflict: LockConflictInfo | null
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  busy?: boolean
}

export const LockConflictDialog = ({ conflict, onOpenChange, onConfirm, busy }: Props) => {
  const { t, locale } = useIntl()
  const navigateToTask = useNavigateToTask()

  const handleGoBack = () => {
    if (!conflict) return
    onOpenChange(false)
    navigateToTask(conflict.lockedTaskId)
  }

  return (
    <Dialog open={conflict != null} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockOpen className="size-5 text-amber-500" aria-hidden="true" />
            {t(
              'taskEditPage.lockConflictDialog.title',
              undefined,
              'You already have a task locked'
            )}
          </DialogTitle>
          <DialogDescription>
            {conflict?.parentName
              ? t(
                  'taskEditPage.lockConflictDialog.descriptionWithChallenge',
                  {
                    taskId: conflict.lockedTaskId,
                    challengeName: conflict.parentName,
                  },
                  'You still hold the lock on task #{taskId} in "{challengeName}". Release it to lock this task instead.'
                )
              : t(
                  'taskEditPage.lockConflictDialog.description',
                  { taskId: conflict?.lockedTaskId ?? 0 },
                  'You still hold the lock on task #{taskId}. Release it to lock this task instead.'
                )}
            {conflict?.startedAt &&
              ` (${t(
                'taskEditPage.lockConflictDialog.lockedSince',
                { time: formatTimeAgo(new Date(conflict.startedAt), locale) },
                'locked {time}'
              )})`}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:flex-wrap sm:gap-2 sm:space-x-0">
          <Button variant="outline" onClick={handleGoBack} disabled={busy}>
            {t('taskEditPage.lockConflictDialog.goBack', undefined, 'Go back to previous task')}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t('taskEditPage.lockConflictDialog.inspect', undefined, 'Inspect this task')}
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy
              ? t('taskEditPage.lockConflictDialog.switching', undefined, 'Switching…')
              : t(
                  'taskEditPage.lockConflictDialog.confirm',
                  undefined,
                  'Release other lock & continue'
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
