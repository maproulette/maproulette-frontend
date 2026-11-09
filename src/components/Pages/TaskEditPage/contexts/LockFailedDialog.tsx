import { LockOpen } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { api } from '@/api'
import { Button } from '@/components/ui/Button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useIntl } from '@/i18n'
import { logger } from '@/lib/logger'

export interface LockFailure {
  message?: string
}

interface Props {
  taskId: number
  failure: LockFailure | null
  onOpenChange: (open: boolean) => void
  onRetry: () => void
  onBrowseChallenge: () => void
  busy?: boolean
}

export const LockFailedDialog = ({
  taskId,
  failure,
  onOpenChange,
  onRetry,
  onBrowseChallenge,
  busy,
}: Props) => {
  const { t } = useIntl()
  const requestUnlockMutation = api.task.useRequestUnlock()
  const [requestedTaskId, setRequestedTaskId] = useState<number | null>(null)

  const handleRequestUnlock = async () => {
    try {
      await requestUnlockMutation.mutateAsync(taskId)
      setRequestedTaskId(taskId)
    } catch (error) {
      logger.error('Failed to request unlock', { taskId, error })
      toast.error(
        t({
          id: 'taskEditPage.lockFailedDialog.requestUnlockFailed',
          defaultMessage: 'Could not request unlock',
        })
      )
    }
  }

  return (
    <Dialog open={failure != null} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LockOpen className="size-5 text-amber-500" aria-hidden="true" />
            {t({
              id: 'taskEditPage.lockFailedDialog.title',
              defaultMessage: 'Unable to Lock Task',
            })}
          </DialogTitle>
          <DialogDescription>
            {failure?.message ??
              t({
                id: 'taskEditPage.lockFailedDialog.genericLockFailure',
                defaultMessage: 'Task lock could not be acquired',
              })}
            {t({
              id: 'taskEditPage.lockFailedDialog.previewAvailable',
              defaultMessage: '. A read-only preview is available.',
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:flex-wrap sm:gap-2 sm:space-x-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {t({ id: 'taskEditPage.lockFailedDialog.preview', defaultMessage: 'Preview Task' })}
          </Button>
          <Button variant="outline" onClick={onRetry} disabled={busy}>
            {t({ id: 'taskEditPage.lockFailedDialog.retryLock', defaultMessage: 'Retry Lock' })}
          </Button>
          <Button variant="outline" onClick={onBrowseChallenge} disabled={busy}>
            {t({
              id: 'common.browseChallengeButton',
              defaultMessage: 'Browse Challenge',
            })}
          </Button>
          {requestedTaskId === taskId ? (
            <span className="self-center text-sm">
              {t({
                id: 'taskEditPage.lockFailedDialog.requestSent',
                defaultMessage: 'Request Sent!',
              })}
            </span>
          ) : (
            <Button
              onClick={handleRequestUnlock}
              disabled={busy || requestUnlockMutation.isPending}
            >
              {t({
                id: 'taskEditPage.lockFailedDialog.requestUnlock',
                defaultMessage: 'Request Unlock',
              })}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
