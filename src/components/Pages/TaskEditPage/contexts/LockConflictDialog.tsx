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
            {t({
              id: 'taskEditPage.lockConflictDialog.title',
              defaultMessage: 'You already have a task locked',
            })}
          </DialogTitle>
          <DialogDescription>
            {conflict?.parentName
              ? t(
                  {
                    id: 'taskEditPage.lockConflictDialog.descriptionWithChallenge',
                    defaultMessage:
                      'You still hold the lock on task #{taskId} in "{challengeName}". Release it to lock this task instead.',
                  },
                  {
                    taskId: conflict.lockedTaskId,
                    challengeName: conflict.parentName,
                  }
                )
              : t(
                  {
                    id: 'taskEditPage.lockConflictDialog.description',
                    defaultMessage:
                      'You still hold the lock on task #{taskId}. Release it to lock this task instead.',
                  },
                  { taskId: conflict?.lockedTaskId ?? 0 }
                )}
            {conflict?.startedAt && (
              <>
                {' '}
                {t(
                  {
                    id: 'taskEditPage.lockConflictDialog.lockedSince',
                    defaultMessage: '(locked {time})',
                  },
                  { time: formatTimeAgo(new Date(conflict.startedAt), locale) }
                )}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:flex-wrap sm:gap-2 sm:space-x-0">
          <Button variant="outline" onClick={handleGoBack} disabled={busy}>
            {t({
              id: 'taskEditPage.lockConflictDialog.goBack',
              defaultMessage: 'Go back to previous task',
            })}
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t({
              id: 'taskEditPage.lockConflictDialog.inspect',
              defaultMessage: 'Inspect this task',
            })}
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {busy
              ? t({ id: 'taskEditPage.lockConflictDialog.switching', defaultMessage: 'Switching…' })
              : t({
                  id: 'taskEditPage.lockConflictDialog.confirm',
                  defaultMessage: 'Release other lock & continue',
                })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
